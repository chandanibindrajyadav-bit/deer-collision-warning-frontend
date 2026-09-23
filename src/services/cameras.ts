import type { Camera, CreateCameraInput } from '../types'

const cameras: Camera[] = [
  { id: 'camera-north-ridge', name: 'North Ridge 01', streamUrl: 'rtsp://demo/north-ridge-01', status: 'connected', roadBoundary: { id: 'road-north-ridge', name: 'Eastbound reserve road', thresholdMeters: 20, geometry: [{ latitude: 27.7172, longitude: 85.324 }, { latitude: 27.718, longitude: 85.331 }] }, location: { latitude: 27.7172, longitude: 85.324, zone: 'North Ridge' }, lastSeenAt: '2026-09-23T10:42:00Z', detectionEnabled: true },
  { id: 'camera-creek-bed', name: 'Creek Bed 02', streamUrl: 'rtsp://demo/creek-bed-02', status: 'connected', roadBoundary: { id: 'road-creek-bed', name: 'Creek access road', thresholdMeters: 25, geometry: [{ latitude: 27.704, longitude: 85.31 }, { latitude: 27.707, longitude: 85.316 }] }, location: { latitude: 27.704, longitude: 85.31, zone: 'Creek Bed' }, lastSeenAt: '2026-09-23T10:41:00Z', detectionEnabled: true },
  { id: 'camera-east-trail', name: 'East Trail 03', streamUrl: 'rtsp://demo/east-trail-03', status: 'connecting', roadBoundary: { id: 'road-east-trail', name: 'East trail road', thresholdMeters: 15, geometry: [{ latitude: 27.725, longitude: 85.342 }, { latitude: 27.731, longitude: 85.347 }] }, location: { latitude: 27.725, longitude: 85.342, zone: 'East Trail' }, lastSeenAt: '2026-09-23T10:36:00Z', detectionEnabled: true },
  { id: 'camera-waterhole', name: 'Waterhole 04', streamUrl: 'rtsp://demo/waterhole-04', status: 'disconnected', roadBoundary: { id: 'road-waterhole', name: 'South service road', thresholdMeters: 30, geometry: [{ latitude: 27.692, longitude: 85.332 }, { latitude: 27.687, longitude: 85.337 }] }, location: { latitude: 27.692, longitude: 85.332, zone: 'South Waterhole' }, lastSeenAt: '2026-09-23T09:58:00Z', detectionEnabled: false },
]

export function getCameras(): Camera[] { return cameras.map((camera) => ({ ...camera })) }
export function getCamera(id: string): Camera | undefined { return getCameras().find((camera) => camera.id === id) }
export function createCamera(input: CreateCameraInput): Camera { return { id: `camera-${Date.now()}`, ...input, roadBoundary: { id: `road-${Date.now()}`, ...input.roadBoundary }, status: 'connecting', detectionEnabled: input.detectionEnabled ?? true } }
export function updateCamera(id: string, input: Partial<CreateCameraInput>): Camera | undefined { const camera = getCamera(id); return camera ? { ...camera, ...input, roadBoundary: input.roadBoundary ? { ...camera.roadBoundary, ...input.roadBoundary } : camera.roadBoundary } : undefined }
export function deleteCamera(id: string): boolean { return Boolean(getCamera(id)) }
