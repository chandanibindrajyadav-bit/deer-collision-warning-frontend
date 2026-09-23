import type { Alert, AlertRule } from '../types'
import { getCameras } from './cameras'
import { getTrackSnapshots } from './tracks'

export function getAlerts(): Alert[] {
  const cameras = getCameras()
  const tracks = getTrackSnapshots().filter((snapshot) => snapshot.collisionRisk.riskLevel === 'high_risk')
  return [...tracks.map((snapshot) => { const camera = cameras.find((item) => item.id === snapshot.detection.cameraId); return { id: `alert-${snapshot.detection.trackId}`, type: 'collision_risk' as const, severity: 'critical' as const, title: 'High-risk deer track', message: snapshot.behavior?.description ?? 'High-risk deer track detected; behavior analysis was not run.', createdAt: snapshot.timestamp, cameraId: camera?.id, trackId: snapshot.detection.trackId, collisionRisk: snapshot.collisionRisk, behavior: snapshot.behavior } }), ...cameras.filter((camera) => camera.status === 'disconnected').map((camera) => ({ id: `alert-disconnect-${camera.id}`, type: 'camera_disconnect' as const, severity: 'critical' as const, title: 'Camera disconnected', message: `${camera.name} is disconnected and has stopped reporting live frames.`, createdAt: camera.lastSeenAt ?? new Date().toISOString(), cameraId: camera.id }))]
}

export function getAlertRules(): AlertRule[] { return [{ id: 'rule-warning-score', name: 'Warning score', enabled: true, type: 'collision_risk', warningScoreThreshold: 0.8 }, { id: 'rule-camera-disconnect', name: 'Camera disconnect', enabled: true, type: 'camera_disconnect' }] }
export function acknowledgeAlert(alertId: string): Alert | undefined { return getAlerts().find((alert) => alert.id === alertId) }
