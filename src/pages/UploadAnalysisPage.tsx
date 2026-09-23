import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, RefObject, SyntheticEvent } from 'react'
import type { TrackSnapshot } from '../types'
import { getCameras } from '../services/cameras'
import { getTrackSnapshots } from '../services/tracks'
import { CameraViewport } from './LiveMonitoringPage'

type AnalysisStatus = 'idle' | 'uploading' | 'inferring' | 'complete'

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function statusLabel(status: AnalysisStatus) {
  if (status === 'uploading') return 'Uploading media'
  if (status === 'inferring') return 'Running deer inference'
  if (status === 'complete') return 'Analysis complete'
  return 'Ready for analysis'
}

function snapshotTime(snapshot: TrackSnapshot) {
  return Date.parse(snapshot.timestamp)
}

function closestSnapshot(playbackSeconds: number) {
  const snapshots = getTrackSnapshots()
  const startTime = snapshotTime(snapshots[0])
  return snapshots.reduce((closest, snapshot) => {
    const currentDistance = Math.abs((snapshotTime(snapshot) - startTime) / 1000 - playbackSeconds)
    const closestDistance = Math.abs((snapshotTime(closest) - startTime) / 1000 - playbackSeconds)
    return currentDistance < closestDistance ? snapshot : closest
  })
}

export function UploadAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [playbackSeconds, setPlaybackSeconds] = useState(0)

  const isVideo = selectedFile?.type.startsWith('video/') ?? false
  const isImage = selectedFile?.type.startsWith('image/') ?? false
  const analysisReady = status === 'complete'
  const activeSnapshot = useMemo(
    () => analysisReady ? (isVideo ? closestSnapshot(playbackSeconds) : getTrackSnapshots()[0]) : null,
    [analysisReady, isVideo, playbackSeconds],
  )

  useEffect(() => {
    if (!selectedFile) return

    const uploadTimer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 20, 100)
        if (next === 100) {
          window.clearInterval(uploadTimer)
          setStatus('inferring')
          window.setTimeout(() => setStatus('complete'), 900)
        }
        return next
      })
    }, 160)

    return () => window.clearInterval(uploadTimer)
  }, [selectedFile])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
    setProgress(0)
    setPlaybackSeconds(0)
    setStatus(file ? 'uploading' : 'idle')
  }

  function handleVideoTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    setPlaybackSeconds(event.currentTarget.currentTime)
  }

  return (
    <section className="upload-page" aria-labelledby="upload-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Offline review</p>
          <h1 id="upload-title">Upload analysis</h1>
          <p className="page-summary">Review deer detections, tracked movement, predicted position, and collision risk from recorded media.</p>
        </div>
        <span className="data-badge">Mock inference</span>
      </div>

      <div className="upload-layout">
        <section className="dashboard-panel upload-panel" aria-labelledby="upload-media-title">
          <div className="panel-heading"><div><p className="panel-kicker">Input media</p><h2 id="upload-media-title">Choose image or video</h2></div><span className="upload-format">JPG, PNG, MP4, MOV</span></div>
          <label className="upload-dropzone" htmlFor="analysis-file">
            <span className="upload-icon" aria-hidden="true">+</span>
            <strong>{selectedFile ? selectedFile.name : 'Select a deer recording'}</strong>
            <span>{selectedFile ? `${formatFileSize(selectedFile.size)} · ${selectedFile.type || 'Media file'}` : 'The mock pipeline accepts image and video files.'}</span>
            <input id="analysis-file" type="file" accept="image/*,video/*" onChange={handleFileChange} />
          </label>
          {selectedFile && <div className="upload-progress-block"><div className="progress-heading"><span>{statusLabel(status)}</span><strong>{progress}%</strong></div><div className="progress-track" aria-label={`Upload progress ${progress}%`}><span style={{ width: `${progress}%` }} /></div>{status === 'inferring' && <p className="progress-note">YOLOv11, ByteTrack, Kalman prediction, and collision-risk rules are processing this media.</p>}</div>}
        </section>

        <section className="dashboard-panel preview-panel" aria-labelledby="preview-title">
          <div className="panel-heading"><div><p className="panel-kicker">Preview</p><h2 id="preview-title">Source media</h2></div></div>
          <div className="upload-preview">{previewUrl && isImage && <img src={previewUrl} alt="Selected deer analysis media" />}{previewUrl && isVideo && !analysisReady && <video src={previewUrl} controls muted aria-label="Selected deer analysis video" />}{!previewUrl && <span>Select a file to preview it here.</span>}{analysisReady && <span>Playback is available in the synced result view below.</span>}</div>
        </section>
      </div>

      {analysisReady && activeSnapshot && <SyncedAnalysisResult snapshot={activeSnapshot} videoRef={videoRef} mediaSrc={previewUrl} isVideo={isVideo} onTimeUpdate={handleVideoTimeUpdate} />}
    </section>
  )
}

function SyncedAnalysisResult({ snapshot, videoRef, mediaSrc, isVideo, onTimeUpdate }: { snapshot: TrackSnapshot; videoRef: RefObject<HTMLVideoElement | null>; mediaSrc: string; isVideo: boolean; onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => void }) {
  const { detection, trajectory, prediction, collisionRisk, behavior } = snapshot
  const cameras = getCameras()
  const camera = cameras.find((item) => item.id === detection.cameraId) ?? cameras[0]

  return (
    <section className="dashboard-panel analysis-result" aria-labelledby="analysis-result-title">
      <div className="panel-heading"><div><p className="panel-kicker">Synced inference result</p><h2 id="analysis-result-title">Track {detection.trackId}</h2></div><span className={`risk-pill ${collisionRisk.riskLevel}`}>{collisionRisk.riskLevel === 'high_risk' ? 'High risk' : 'Safe'}</span></div>
      <div className="synced-result-grid">
        <div className="uploaded-video-panel"><p className="panel-kicker">Uploaded playback</p>{isVideo ? <video ref={videoRef} src={mediaSrc} controls onTimeUpdate={onTimeUpdate} aria-label="Uploaded deer analysis playback" /> : <img src={mediaSrc} alt="Uploaded deer analysis result" />}</div>
        <div className="synced-overlay-panel"><p className="panel-kicker">Live track plot</p><CameraViewport camera={camera} snapshot={snapshot} overlayOnly focused /></div>
      </div>
      <div className="result-metrics"><span><small>Track ID</small>{detection.trackId}</span><span><small>Confidence</small>{Math.round(detection.confidence * 100)}%</span><span><small>Trajectory points</small>{trajectory.positions.length}</span><span><small>Predicted heading</small>{prediction.predictedHeading}°</span><span><small>Warning score</small>{Math.round(collisionRisk.warningScore * 100)}%</span></div>
      <div className="live-result-copy"><span>Timeline frame: {snapshot.timestamp}</span><p>{behavior ? `${behavior.behaviorLabel}: ${behavior.description}` : 'No Florence-2 behavior analysis was run for this safe track.'}</p></div>
    </section>
  )
}
