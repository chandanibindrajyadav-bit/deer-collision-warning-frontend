export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertType = 'collision_risk' | 'low_confidence' | 'camera_disconnect'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  cameraId?: string
  trackId?: string
  collisionRisk?: import('./detection').CollisionRisk
  behavior?: import('./detection').BehaviorAnalysis
}

export interface AlertRule {
  id: string
  name: string
  enabled: boolean
  type: AlertType
  warningScoreThreshold?: number
  cameraIds?: string[]
}
