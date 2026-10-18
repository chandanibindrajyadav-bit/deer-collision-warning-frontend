# Copilot Prompt — Deer Collision Warning Backend (FastAPI)

Companion to `copilot-prompt-deer-collision-warning-frontend.md` and `PROJECT-STATUS.md`. Read both if
they're in this repo/workspace — the backend's data shapes must exactly match the frontend's existing
TypeScript types and the calls already made from `src/services/` (cameras.ts, detections.ts, tracks.ts,
alerts.ts).

---

I'm building the **backend** for a deer detection, tracking, trajectory-prediction, and collision-warning
system, in **Python with FastAPI**. Nothing exists yet — have trained model, no pipeline code. Build this in
two tracks, in this order, confirming each step before moving to the next:

**Track A — API contract first (unblocks frontend integration immediately)**
**Track B — Real ML pipeline (training done, then real-time inference)**, which later replaces the mock
internals of Track A's endpoints without changing their request/response shape.

> **Status update: the YOLOv11 model is already trained.** A `.pt` weights file (Ultralytics YOLOv11,
> fine-tuned on deer) already exists. **Skip Track B's Phase 1 (steps 7–11, offline training pipeline)
> entirely** — do not attempt to retrain or regenerate a dataset. Go straight to Phase 2 (real-time
> inference) once Track A is confirmed, loading the existing weights file with `ultralytics.YOLO('path/to/weights.pt')`.

## Critical shared contract (must match frontend types exactly)

These mirror the frontend's `src/types/*.ts`. Model them as Pydantic models with identical field names
(camelCase in JSON responses, matching what the frontend already expects):

- `Detection`: id, trackId, boundingBox {x,y,width,height}, confidence, timestamp, cameraId, source
- `Trajectory`: trackId, positions: [{x, y, timestamp}]
- `Prediction`: trackId, predictedNextPosition {x,y,timestamp}, predictedVelocity {x,y}, predictedHeading
- `CollisionRisk`: trackId, speed, headingAngle, predictedCrossingPoint (nullable), riskLevel
  (`'safe' | 'high_risk'`), warningScore — **do NOT include `distanceToRoad`, it was intentionally removed**
- `BehaviorAnalysis` (optional — only present when riskLevel is high_risk): trackId, behaviorLabel,
  description, generatedBy (`'florence-2'`)
- `TrackSnapshot`: timestamp, detection, trajectory, prediction, collisionRisk, behavior (optional)
- `Camera`: id, name, streamUrl, status (`'connected'|'disconnected'|'connecting'`), location
  {latitude,longitude,zone}, lastSeenAt, detectionEnabled, roadBoundary {id, name, thresholdDistance,
  geometry coordinates} — each camera has its OWN independent roadBoundary
- `User`: id, name, email, role (`'admin'|'viewer'`), avatarUrl
- `Alert`: id, type, severity, title, message, createdAt, acknowledgedAt, acknowledgedBy, cameraId,
  detectionId
- `AlertRule`: id, name, enabled, type, confidenceThreshold, cameraIds — warning-score / road-crossing
  based, not distance-based
- Single species only — deer. No species field/filtering needed anywhere.

## Track A — Build order (do this first, entirely mock-backed)

1. Scaffold FastAPI project: `app/main.py`, `app/models/` (Pydantic schemas above), `app/routers/`,
   `requirements.txt`, CORS configured for the frontend's local dev origin.
2. Implement the Pydantic models exactly as specified above.
3. Build mock-data endpoints matching what the frontend's service layer already calls:
   - `GET /cameras`, `GET /cameras/{id}`, `POST /cameras`, `PUT /cameras/{id}`, `DELETE /cameras/{id}`
   - `GET /tracks`, `GET /tracks/{trackId}`
   - `GET /detections`, `GET /detections/history` (with query params: page, pageSize, cameraId, from, to,
     minConfidence, sortBy, sortOrder)
   - `GET /alerts`, `GET /alerts/rules`, `POST /alerts/{id}/acknowledge`
   - `POST /auth/login`, returning a mock token + user matching the frontend's `AuthSession` shape
   Return realistic mock data (reuse the same example values the frontend mock data used: North Ridge 01,
   Creek Bed 02, East Trail 03, Waterhole 04, track-88 etc.) so responses look correct when the frontend
   connects.
4. Add a `WebSocket /ws/tracks` endpoint that pushes a mock `TrackSnapshot` every few seconds, so the
   frontend's step 13 (live updates) can be tested end-to-end before real inference exists.
5. Add a `POST /analysis/upload` endpoint accepting a video/image file (multipart) that, for now, returns a
   mock array of timestamped `TrackSnapshot`s (matching what Upload Analysis on the frontend expects), so
   that flow can be tested too.
6. Confirm with me that all of this runs locally and the frontend can point its `VITE_API_BASE_URL` /
   `VITE_WS_URL` at it and get real (if mocked) responses, before starting Track B.

## Track B — Real ML pipeline (only after Track A is confirmed working)

**Phase 1 — Offline training pipeline** — **ALREADY DONE, SKIP.** A fine-tuned YOLOv11 `.pt` weights file
already exists. Steps 7–11 below are kept only for reference/documentation, do not redo them:
7. ~~Video collection guidance/checklist (daylight/night/rain/fog, multiple angles, deer crossing/standing/
   running).~~
8. ~~Frame extraction with OpenCV (every Nth frame).~~
9. ~~Automatic annotation with Grounding DINO using the text prompt "deer".~~
10. ~~Annotation processing with Supervision — convert detections to YOLO format, export dataset.~~
11. ~~Fine-tune YOLOv11 on the generated dataset.~~

**Phase 2 — Real-time inference pipeline** (replaces Track A's mocks; start here directly):
12. OpenCV video ingestion from camera/dashcam/recorded file feeding frames into the pipeline.
13. Load the existing trained weights (`ultralytics.YOLO('<path-to-weights>.pt')`) and run it per frame →
    detections (bbox, confidence).
14. Feed detections through ByteTrack → persistent `trackId` per deer across frames.
15. Maintain per-track coordinate history → build `Trajectory`.
16. Apply a Kalman Filter per track using current position + velocity → produce `Prediction`
    (predictedNextPosition, predictedVelocity, predictedHeading).
17. Build the rule-based collision risk engine: combine position, predicted position, speed, heading,
    distance/intersection with each camera's `roadBoundary` geometry → classify `riskLevel` (safe/
    high_risk) and compute `warningScore`. This is deterministic, no model needed.
18. When a track is classified `high_risk`, crop the deer from the frame and send it to Florence-2 with the
    prompt "What is this deer doing?" → populate `BehaviorAnalysis` (behaviorLabel + description). Skip
    this entirely for safe tracks — do not call Florence-2 on every frame.
19. Replace the mock internals of every Track A endpoint with real pipeline output — endpoint paths,
    request/response shapes, and the WebSocket message format must stay identical to Track A so the
    frontend requires no changes.
20. Add basic tests for the collision risk rule engine (given known positions/speeds/road geometry, assert
    expected riskLevel) since this logic is deterministic and easy to unit test.
21. Add deployment config: Dockerfile, environment variables, and notes on GPU requirements for YOLOv11
    and Florence-2 inference.

Confirm scope and Track A's step 1 before writing any code.
