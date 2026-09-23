import type { DetectionHistoryQuery, DetectionLog } from '../types'
import { getTrackSnapshots } from './tracks'

export function getDetections(): DetectionLog[] { return getTrackSnapshots().map(({ detection }) => ({ ...detection, cameraName: detection.cameraId.replace('camera-', '').replaceAll('-', ' ') })) }
export function getDetectionHistory(_query: DetectionHistoryQuery = {}): DetectionLog[] { return getDetections() }
