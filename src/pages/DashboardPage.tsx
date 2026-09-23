import { useState } from 'react'
import type { CameraStatus, RiskLevel } from '../types'
import { getCameras } from '../services/cameras'
import { getTrackSnapshots } from '../services/tracks'

const statusLabels: Record<CameraStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
}

const riskLabels: Record<RiskLevel, string> = {
  safe: 'Safe',
  high_risk: 'High risk',
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
}

export function DashboardPage() {
  const [cameraFilter, setCameraFilter] = useState<CameraStatus | 'all'>('all')
  const cameras = getCameras()
  const trackSnapshots = getTrackSnapshots()
  const filteredCameras = cameras.filter((camera) => cameraFilter === 'all' || camera.status === cameraFilter)
  const highRiskTracks = trackSnapshots.filter((track) => track.collisionRisk.riskLevel === 'high_risk')
  const connectedCameras = cameras.filter((camera) => camera.status === 'connected').length
  const averageConfidence = Math.round(trackSnapshots.reduce((total, track) => total + track.detection.confidence, 0) / trackSnapshots.length * 100)

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Collision warning overview</p>
          <h1 id="dashboard-title">Roadside awareness</h1>
          <p className="page-summary">Current deer tracks, predicted movement, and collision risk across monitored roads.</p>
        </div>
        <span className="data-badge">Mock data</span>
      </div>

      <div className="summary-grid" aria-label="Collision warning summary">
        <article className="summary-card risk-summary-card"><span className="summary-label">High-risk tracks today</span><strong>{highRiskTracks.length}</strong><span className="summary-note danger">Driver warnings active</span></article>
        <article className="summary-card"><span className="summary-label">Total active tracks</span><strong>{trackSnapshots.length}</strong><span className="summary-note">ByteTrack identities</span></article>
        <article className="summary-card"><span className="summary-label">Camera uptime</span><strong>{connectedCameras}/{cameras.length}</strong><span className="summary-note">Cameras connected</span></article>
        <article className="summary-card"><span className="summary-label">Avg. detection confidence</span><strong>{averageConfidence}%</strong><span className="summary-note positive">YOLOv11 detections</span></article>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel detections-panel" aria-labelledby="high-risk-events-title">
          <div className="panel-heading"><div><p className="panel-kicker">Immediate attention</p><h2 id="high-risk-events-title">Recent high-risk events</h2></div><span className="data-badge">{highRiskTracks.length} active</span></div>
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Track</th><th>Camera</th><th>Risk</th><th>Score</th><th>Behavior</th></tr></thead><tbody>{highRiskTracks.map((track) => (<tr key={track.detection.id}><td><strong>{track.detection.trackId}</strong></td><td>{track.detection.cameraId.replace('camera-', '').replaceAll('-', ' ')}</td><td><span className="confidence danger">{riskLabels[track.collisionRisk.riskLevel]}</span></td><td>{Math.round(track.collisionRisk.warningScore * 100)}%</td><td className="behavior-cell">{track.behavior?.description ?? 'Behavior analysis not run'}</td></tr>))}</tbody></table></div>
        </section>

        <section className="dashboard-panel camera-panel" aria-labelledby="camera-status-title">
          <div className="panel-heading"><div><p className="panel-kicker">Infrastructure</p><h2 id="camera-status-title">Camera status</h2></div><label className="compact-filter"><span className="sr-only">Filter cameras by status</span><select value={cameraFilter} onChange={(event) => setCameraFilter(event.target.value as CameraStatus | 'all')}><option value="all">All</option><option value="connected">Connected</option><option value="connecting">Connecting</option><option value="disconnected">Offline</option></select></label></div>
          <div className="camera-list">{filteredCameras.map((camera) => (<div className="camera-row" key={camera.id}><span className={`camera-status-dot ${camera.status}`} aria-label={statusLabels[camera.status]} /><div className="camera-info"><strong>{camera.name}</strong><span>{camera.location?.zone}</span></div><span className={`camera-status-text ${camera.status}`}>{statusLabels[camera.status]}</span></div>))}</div>
        </section>
      </div>

      <p className="dashboard-updated">Last track update {formatTime(trackSnapshots[0].detection.timestamp)} · Collision risk uses position, prediction, speed, heading, and road boundary.</p>
    </section>
  )
}
