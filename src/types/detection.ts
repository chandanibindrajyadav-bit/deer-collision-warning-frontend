export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
  timestamp: string
}

export type DetectionSource = 'camera' | 'image' | 'video'

export interface Detection {
  id: string
  trackId: string
  boundingBox: BoundingBox
  confidence: number
  timestamp: string
  cameraId: string
  source: DetectionSource
}

export interface Trajectory {
  trackId: string
  positions: Position[]
}

export interface Prediction {
  trackId: string
  predictedNextPosition: Position
  predictedVelocity: { x: number; y: number }
  predictedHeading: number
  generatedBy: 'kalman_filter'
}

export type RiskLevel = 'safe' | 'high_risk'

export interface CollisionRisk {
  trackId: string
  speed: number
  headingAngle: number
  predictedCrossingPoint: Position | null
  riskLevel: RiskLevel
  warningScore: number
}

export interface BehaviorAnalysis {
  trackId: string
  behaviorLabel: string
  description: string
  generatedBy: 'florence-2'
}

export interface TrackSnapshot {
  timestamp: string
  detection: Detection
  trajectory: Trajectory
  prediction: Prediction
  collisionRisk: CollisionRisk
  behavior?: BehaviorAnalysis
}

export interface DetectionLog extends Detection {
  cameraName?: string
}

export interface DetectionHistoryQuery {
  page?: number
  pageSize?: number
  cameraId?: string
  trackId?: string
  riskLevel?: RiskLevel
  from?: string
  to?: string
  sortBy?: 'trackId' | 'timestamp' | 'warningScore'
  sortOrder?: 'asc' | 'desc'
}
