export type CameraStatus = 'connected' | 'disconnected' | 'connecting'

export interface CameraLocation {
  latitude: number
  longitude: number
  zone?: string
}

export interface RoadBoundary {
  id: string
  name: string
  thresholdMeters: number
  geometry: Array<{ latitude: number; longitude: number }>
}

export interface Camera {
  id: string
  name: string
  streamUrl: string
  status: CameraStatus
  location?: CameraLocation
  roadBoundary: RoadBoundary
  lastSeenAt?: string
  detectionEnabled: boolean
}

export interface CreateCameraInput {
  name: string
  streamUrl: string
  location?: CameraLocation
  roadBoundary: Omit<RoadBoundary, 'id'>
  detectionEnabled?: boolean
}

export type UpdateCameraInput = Partial<CreateCameraInput>
