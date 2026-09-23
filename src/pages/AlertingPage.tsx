import { useState } from 'react'
import type { AlertRule, AlertType } from '../types'
import { getCameras } from '../services/cameras'
import { getTrackSnapshots } from '../services/tracks'

interface AlertRow {
  id: string
  createdAt: string
  cameraId: string
  cameraName: string
  trackId?: string
  type: AlertType
  riskLevel: 'safe' | 'high_risk'
  warningScore?: number
  message: string
  behavior?: string
  acknowledged: boolean
}

const initialRules: AlertRule[] = [
  { id: 'rule-warning-score', name: 'Warning score', enabled: true, type: 'collision_risk', warningScoreThreshold: 0.8 },
  { id: 'rule-camera-disconnect', name: 'Camera disconnect', enabled: true, type: 'camera_disconnect' },
]

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp))
}

function buildAlerts(rules: AlertRule[]): AlertRow[] {
  const scoreRule = rules.find((rule) => rule.id === 'rule-warning-score')
  const disconnectRule = rules.find((rule) => rule.id === 'rule-camera-disconnect')
  const cameras = getCameras()
  const trackAlerts = getTrackSnapshots()
    .filter((snapshot) => snapshot.collisionRisk.riskLevel === 'high_risk')
    .filter((snapshot) => scoreRule?.enabled && snapshot.collisionRisk.warningScore >= (scoreRule.warningScoreThreshold ?? 1))
    .map((snapshot) => {
      const camera = cameras.find((item) => item.id === snapshot.detection.cameraId) ?? cameras[0]
      return {
        id: `alert-${snapshot.detection.trackId}`,
        createdAt: snapshot.timestamp,
        cameraId: camera.id,
        cameraName: camera.name,
        trackId: snapshot.detection.trackId,
        type: 'collision_risk' as const,
        riskLevel: snapshot.collisionRisk.riskLevel,
        warningScore: snapshot.collisionRisk.warningScore,
        message: snapshot.behavior?.description ?? 'High-risk deer track detected; behavior analysis was not run.',
        behavior: snapshot.behavior?.description,
        acknowledged: false,
      }
    })
  const disconnectAlerts = disconnectRule?.enabled ? cameras.filter((camera) => camera.status === 'disconnected').map((camera) => ({
    id: `alert-disconnect-${camera.id}`,
    createdAt: camera.lastSeenAt ?? new Date().toISOString(),
    cameraId: camera.id,
    cameraName: camera.name,
    type: 'camera_disconnect' as const,
    riskLevel: 'high_risk' as const,
    message: `${camera.name} is disconnected and has stopped reporting live frames.`,
    acknowledged: false,
  })) : []
  return [...trackAlerts, ...disconnectAlerts].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
}

export function AlertingPage() {
  const [rules, setRules] = useState(initialRules)
  const [alerts, setAlerts] = useState<AlertRow[]>(() => buildAlerts(initialRules))

  const activeHighRisk = alerts.find((alert) => alert.riskLevel === 'high_risk' && !alert.acknowledged && alert.type === 'collision_risk')
  const acknowledgedCount = alerts.filter((alert) => alert.acknowledged).length

  function updateRule(id: string, patch: Partial<AlertRule>) {
    const nextRules = rules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule)
    setRules(nextRules)
    setAlerts(buildAlerts(nextRules))
  }

  function acknowledgeAlert(id: string) {
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, acknowledged: true } : alert))
  }

  return (
    <section className="alerting-page" aria-labelledby="alerting-title">
      <div className="page-heading"><div><p className="eyebrow">Safety operations</p><h1 id="alerting-title">Alerting</h1><p className="page-summary">Configure collision-warning rules and review operator alerts from monitored deer tracks.</p></div><span className="data-badge">Mock alerts</span></div>

      {activeHighRisk && <section className="alert-toast" role="alert" aria-live="assertive"><div><span className="alert-toast-label">High-risk deer warning</span><strong>{activeHighRisk.trackId} · {activeHighRisk.cameraName}</strong><p>{activeHighRisk.message}</p></div><button type="button" className="primary-button" onClick={() => acknowledgeAlert(activeHighRisk.id)}>Acknowledge</button></section>}

      <div className="alerting-grid">
        <section className="dashboard-panel rules-panel" aria-labelledby="rules-title"><div className="panel-heading"><div><p className="panel-kicker">Rule configuration</p><h2 id="rules-title">Alert rules</h2></div></div><div className="alert-rule-list">{rules.map((rule) => <div className="alert-rule-row" key={rule.id}><div><strong>{rule.name}</strong><span>{rule.type === 'camera_disconnect' ? 'Notify when a camera stops reporting.' : 'Trigger when collision warning score is exceeded.'}</span></div><label className="switch-label"><input type="checkbox" checked={rule.enabled} onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })} /><span>{rule.enabled ? 'On' : 'Off'}</span></label>{rule.id === 'rule-warning-score' && <label className="rule-value">Score<input type="number" min="0" max="1" step="0.05" value={rule.warningScoreThreshold ?? 0.8} onChange={(event) => updateRule(rule.id, { warningScoreThreshold: Number(event.target.value) })} /></label>}</div>)}</div></section>

        <section className="dashboard-panel alert-summary-panel" aria-labelledby="alert-summary-title"><div className="panel-heading"><div><p className="panel-kicker">Current queue</p><h2 id="alert-summary-title">Alert status</h2></div></div><div className="alert-summary-stats"><span><small>Active alerts</small>{alerts.length - acknowledgedCount}</span><span><small>High-risk</small>{alerts.filter((alert) => alert.riskLevel === 'high_risk').length}</span><span><small>Acknowledged</small>{acknowledgedCount}</span></div><p className="alert-note">Behavior text is shown in full when Florence-2 analysis is available. Safe tracks are not promoted into this alert queue.</p></section>
      </div>

      <section className="dashboard-panel alert-history-panel" aria-labelledby="alert-history-title"><div className="panel-heading"><div><p className="panel-kicker">Operator log</p><h2 id="alert-history-title">Alert history</h2></div><span className="data-badge">{alerts.length} records</span></div>{alerts.length ? <div className="history-table-wrap"><table className="data-table alert-history-table"><thead><tr><th>Time</th><th>Camera</th><th>Track</th><th>Risk</th><th>Score</th><th>Behavior / message</th><th>Status</th><th>Action</th></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.id}><td>{formatDate(alert.createdAt)}</td><td>{alert.cameraName}</td><td>{alert.trackId ?? '—'}</td><td><span className={`risk-pill ${alert.riskLevel}`}>{alert.riskLevel === 'high_risk' ? 'High risk' : 'Safe'}</span></td><td>{alert.warningScore === undefined ? '—' : `${Math.round(alert.warningScore * 100)}%`}</td><td className="alert-message-cell">{alert.message}</td><td><span className={alert.acknowledged ? 'acknowledged' : 'pending-ack'}>{alert.acknowledged ? 'Acknowledged' : 'Pending'}</span></td><td>{alert.acknowledged ? <span className="table-muted">Complete</span> : <button type="button" className="table-action" onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</button>}</td></tr>)}</tbody></table></div> : <div className="history-empty"><strong>No alerts match the current rules.</strong></div>}</section>
    </section>
  )
}
