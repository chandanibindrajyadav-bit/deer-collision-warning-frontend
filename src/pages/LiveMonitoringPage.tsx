import { useEffect, useRef, useState } from 'react'
import type { Camera, RiskLevel, TrackSnapshot } from '../types'
import { getCameras } from '../services/cameras'
import { getTrackSnapshots } from '../services/tracks'

const FRAME_WIDTH = 800
const FRAME_HEIGHT = 450

const riskColors: Record<RiskLevel, string> = {
  safe: '#70d49a',
  high_risk: '#dc806f',
}

interface DetectionOverlayProps {
  snapshot: TrackSnapshot
}

export function DetectionOverlay({ snapshot }: DetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { detection, trajectory, prediction, collisionRisk } = snapshot

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = FRAME_WIDTH
    canvas.height = FRAME_HEIGHT
    context.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)

    const color = riskColors[collisionRisk.riskLevel]
    const toPoint = (point: { x: number; y: number }) => point

    context.lineWidth = 3
    context.strokeStyle = color
    context.beginPath()
    trajectory.positions.forEach((position, index) => {
      const point = toPoint(position)
      if (index === 0) context.moveTo(point.x, point.y)
      else context.lineTo(point.x, point.y)
    })
    context.stroke()

    const lastPosition = trajectory.positions.at(-1)
    if (lastPosition) {
      context.setLineDash([9, 7])
      context.strokeStyle = '#e0ad63'
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(lastPosition.x, lastPosition.y)
      context.lineTo(prediction.predictedNextPosition.x, prediction.predictedNextPosition.y)
      context.stroke()
      context.setLineDash([])

      context.fillStyle = '#e0ad63'
      context.beginPath()
      context.arc(prediction.predictedNextPosition.x, prediction.predictedNextPosition.y, 8, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = '#14231d'
      context.lineWidth = 2
      context.stroke()
    }

    context.strokeStyle = color
    context.lineWidth = 3
    context.strokeRect(detection.boundingBox.x, detection.boundingBox.y, detection.boundingBox.width, detection.boundingBox.height)

    const label = `${detection.trackId} · ${Math.round(detection.confidence * 100)}%`
    context.font = '600 14px Arial'
    const labelWidth = context.measureText(label).width + 18
    context.fillStyle = color
    context.fillRect(detection.boundingBox.x, Math.max(0, detection.boundingBox.y - 25), labelWidth, 25)
    context.fillStyle = '#102019'
    context.fillText(label, detection.boundingBox.x + 9, Math.max(17, detection.boundingBox.y - 8))
  }, [collisionRisk.riskLevel, detection, prediction, trajectory])

  return <canvas ref={canvasRef} className="detection-canvas" aria-label={`Detection overlay for ${detection.trackId}`} />
}

interface CameraViewportProps {
  camera: Camera
  snapshot?: TrackSnapshot
  focused?: boolean
  mediaSrc?: string
  mediaType?: 'image' | 'video'
  overlayOnly?: boolean
}

export function CameraViewport({ camera, snapshot, focused, mediaSrc, mediaType = 'video', overlayOnly = false }: CameraViewportProps) {
  return (
    <article className={`camera-viewport${focused ? ' focused' : ''}`}>
      <div className="viewport-header">
        <div><strong>{camera.name}</strong><span>{camera.location?.zone}</span></div>
        <span className={`camera-status-text ${camera.status}`}>{camera.status}</span>
      </div>
      <div className="video-stage">
        {!overlayOnly && (mediaType === 'image' && mediaSrc ? <img className="monitor-video" src={mediaSrc} alt={`Uploaded analysis media for ${camera.name}`} /> : <video className="monitor-video" src={mediaSrc} muted playsInline controls={Boolean(mediaSrc)} aria-label={`Live feed from ${camera.name}`} />)}
        {snapshot && <DetectionOverlay snapshot={snapshot} />}
        {!snapshot && <span className="feed-message">No track data available</span>}
      </div>
      <div className="viewport-footer">
        {snapshot ? <><span className={`risk-pill ${snapshot.collisionRisk.riskLevel}`}>{snapshot.collisionRisk.riskLevel === 'high_risk' ? 'High risk' : 'Safe'}</span><span>{snapshot.collisionRisk.speed.toFixed(1)} m/s</span></> : <span>Waiting for tracking data</span>}
      </div>
    </article>
  )
}

export function LiveMonitoringPage() {
  const [view, setView] = useState<'focus' | 'grid'>('focus')
  const cameras = getCameras()
  const snapshots = getTrackSnapshots()
  const [selectedCameraId, setSelectedCameraId] = useState(cameras[0].id)
  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId) ?? cameras[0]
  const selectedSnapshot = snapshots.find((snapshot) => snapshot.detection.cameraId === selectedCamera.id)

  return (
    <section className="monitoring-page" aria-labelledby="monitoring-title">
      <div className="page-heading monitoring-heading">
        <div><p className="eyebrow">Live tracking workspace</p><h1 id="monitoring-title">Roadside monitoring</h1><p className="page-summary">ByteTrack identities with trajectory history and Kalman-filtered predicted positions.</p></div>
        <div className="monitor-controls"><div className="view-switcher" role="group" aria-label="Monitoring view"><button type="button" className={view === 'focus' ? 'selected' : ''} onClick={() => setView('focus')}>Single camera</button><button type="button" className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')}>Camera grid</button></div><span className="stream-status"><span className="status-dot" aria-hidden="true" />Mock stream</span></div>
      </div>

      {view === 'focus' ? <div className="focus-monitor-layout"><aside className="monitor-camera-list" aria-label="Available cameras">{cameras.map((camera) => <button type="button" className={selectedCamera.id === camera.id ? 'selected' : ''} key={camera.id} onClick={() => setSelectedCameraId(camera.id)}><span className={`camera-status-dot ${camera.status}`} /><span><strong>{camera.name}</strong><small>{camera.location?.zone}</small></span></button>)}</aside><CameraViewport camera={selectedCamera} snapshot={selectedSnapshot} focused /></div> : <div className="monitor-grid">{cameras.map((camera) => <CameraViewport key={camera.id} camera={camera} snapshot={snapshots.find((snapshot) => snapshot.detection.cameraId === camera.id)} />)}</div>}

      <div className="overlay-legend" aria-label="Overlay legend"><span><i className="legend-swatch safe" />Safe track and actual trajectory</span><span><i className="legend-swatch high-risk" />High-risk track and bounding box</span><span><i className="legend-swatch predicted" />Kalman predicted position</span></div>
    </section>
  )
}
