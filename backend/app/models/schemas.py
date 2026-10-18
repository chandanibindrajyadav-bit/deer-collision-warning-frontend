from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class BoundingBox(ApiModel):
    x: float
    y: float
    width: float
    height: float


class Position(ApiModel):
    x: float
    y: float
    timestamp: datetime


class Velocity(ApiModel):
    x: float
    y: float


class DetectionSource(str, Enum):
    camera = "camera"
    image = "image"
    video = "video"


class Detection(ApiModel):
    id: str
    trackId: str
    boundingBox: BoundingBox
    confidence: float = Field(ge=0, le=1)
    timestamp: datetime
    cameraId: str
    source: DetectionSource


class Trajectory(ApiModel):
    trackId: str
    positions: list[Position]


class Prediction(ApiModel):
    trackId: str
    predictedNextPosition: Position
    predictedVelocity: Velocity
    predictedHeading: float
    generatedBy: Literal["kalman_filter"]


class RiskLevel(str, Enum):
    safe = "safe"
    high_risk = "high_risk"


class CollisionRisk(ApiModel):
    trackId: str
    speed: float
    headingAngle: float
    predictedCrossingPoint: Position | None
    riskLevel: RiskLevel
    warningScore: float = Field(ge=0, le=1)


class BehaviorAnalysis(ApiModel):
    trackId: str
    behaviorLabel: str
    description: str
    generatedBy: Literal["florence-2"]


class TrackSnapshot(ApiModel):
    timestamp: datetime
    detection: Detection
    trajectory: Trajectory
    prediction: Prediction
    collisionRisk: CollisionRisk
    behavior: BehaviorAnalysis | None = None


class CameraStatus(str, Enum):
    connected = "connected"
    disconnected = "disconnected"
    connecting = "connecting"


class CameraLocation(ApiModel):
    latitude: float
    longitude: float
    zone: str | None = None


class RoadBoundaryPoint(ApiModel):
    latitude: float
    longitude: float


class RoadBoundary(ApiModel):
    id: str
    name: str
    thresholdMeters: float
    geometry: list[RoadBoundaryPoint]


class Camera(ApiModel):
    id: str
    name: str
    streamUrl: str
    status: CameraStatus
    location: CameraLocation | None = None
    roadBoundary: RoadBoundary
    lastSeenAt: datetime | None = None
    detectionEnabled: bool


class UserRole(str, Enum):
    admin = "admin"
    viewer = "viewer"


class User(ApiModel):
    id: str
    name: str
    email: str
    role: UserRole
    avatarUrl: str | None = None


class AlertSeverity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertType(str, Enum):
    collision_risk = "collision_risk"
    low_confidence = "low_confidence"
    camera_disconnect = "camera_disconnect"


class Alert(ApiModel):
    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    createdAt: datetime
    acknowledgedAt: datetime | None = None
    acknowledgedBy: str | None = None
    cameraId: str | None = None
    trackId: str | None = None
    collisionRisk: CollisionRisk | None = None
    behavior: BehaviorAnalysis | None = None


class AlertRule(ApiModel):
    id: str
    name: str
    enabled: bool
    type: AlertType
    warningScoreThreshold: float | None = Field(default=None, ge=0, le=1)
    cameraIds: list[str] | None = None


class AuthSession(ApiModel):
    user: User
    accessToken: str
    expiresAt: datetime
