# Project Status — Read This First (Fresh Copilot Session)

This is an **existing, in-progress project**. Do not scaffold a new project or assume a blank state.
Before doing anything, read `copilot-prompt-deer-collision-warning-frontend.md` in this repo — that is
the full spec. This file tells you exactly what has already been built, so you don't repeat or contradict
earlier work.

## What this project is
A frontend for a deer detection, tracking, trajectory prediction, and collision warning system.
Pipeline: YOLOv11 detection → ByteTrack tracking (persistent `trackId`) → Kalman filter trajectory
prediction → rule-based collision risk scoring (Safe / High Risk) → optional Florence-2 VLM behavior
reasoning (only runs on high-risk tracks) → alert.

## Completed steps (1–11)
1. **Scaffold** — Vite + React + TypeScript + Tailwind + ESLint project set up.
2. **Types** — `Detection`, `Trajectory`, `Prediction`, `CollisionRisk`, `BehaviorAnalysis`, `Camera`
   (with `roadBoundary`, independent per camera), `User`, `Alert`, `TrackSnapshot` all defined in
   `src/types/`. React Query and Zustand configured (`AppProviders.tsx`, `uiStore.ts`).
3. **Auth** — mock authentication in `authStore.ts`, login page, role-based route guards
   (`ProtectedRoute.tsx`) for admin/viewer. Demo accounts exist (admin@wildlife.local / viewer@wildlife.local).
4. **App shell** — sidebar, header, routing, dark/light theme tokens (`AppShell.tsx`).
5. **Dashboard** — high-risk tracks today, total active tracks, camera uptime, avg confidence, recent
   high-risk events table, camera status panel.
6. **Camera Management** — add/edit/remove camera, geospatial map view with road boundary/geofence per
   camera (each camera has its own independent `roadBoundary`, not shared).
7. **Live Monitoring** — single-camera focus + multi-camera grid, shared `CameraViewport` /
   `DetectionOverlay` canvas component draws bounding box (risk-colored), solid trajectory trail, dashed
   Kalman-predicted path + marker.
8. **Upload Analysis** — file upload, progress/inference loading states, **synced two-panel result view**:
   video plays left, right panel shows live-updating overlay (reused `DetectionOverlay`/`CameraViewport`
   via an `overlayOnly` prop) synced to `video.currentTime` via `timeupdate`, picking the closest
   timestamped mock `TrackSnapshot`. Risk pill and behavior text update live during playback.
9. **Detection/Track History** — filterable, sortable table with export.
10. **Analytics** — analytics dashboard with KPI summary cards and interactive charts for deer detection/tracking activity over time, high-risk event frequency, and activity by camera. Supports time-range and camera filtering, with charts and KPIs updating from the same filtered dataset. Visualizations were refined for clearer timestamps, readable axes/tooltips, high-risk event timing, and camera comparison. Empty/sparse-data states are handled without inventing data.

11. **Alerting** — alerting dashboard with configurable rules for road-boundary/collision-risk conditions, warning-score thresholds, and camera disconnects. Includes high-risk notifications, alert history, and acknowledgment workflow. Alert records show timestamp, camera, track ID, risk level, warning score, and available behavior information. Full Florence-2 behavior text is displayed when present; non-high-risk tracks clearly indicate that behavior analysis was not run. Uses existing alert/risk types and mock service data.

## Important corrections already applied — do not reintroduce
- **`distanceToRoad` was removed entirely** from the data model and UI. It does NOT exist in
  `CollisionRisk` or anywhere else. Do not add it back. Collision risk uses: position, predicted position,
  speed, heading, and road boundary/predicted crossing point — not a raw distance-to-road number.
- **Single species: deer only.** No multi-species fields, filters, or copy anywhere.
- **Behavior analysis is conditional**, not universal — only present on high-risk tracks. UI must always
  handle its absence gracefully (see Dashboard/Alerting/Upload Analysis pattern).

## Modular service layer (important — read before step 12)
All data fetching goes through centralized service functions in `src/services/`:
- `cameras.ts` — `getCameras()`, `getCamera(id)`, `createCamera(input)`, `updateCamera(id, input)`,
  `deleteCamera(id)`
- `tracks.ts` — `getTrackSnapshots()`, `getTrackSnapshot(trackId)`
- `detections.ts` — `getDetections()`, `getDetectionHistory(query)`
- `alerts.ts` — `getAlerts()`, `getAlertRules()`, `acknowledgeAlert(alertId)`

Every page (`DashboardPage`, `CameraManagementPage`, `LiveMonitoringPage`, `UploadAnalysisPage`,
`DetectionHistoryPage`, `AnalyticsPage`, `AlertingPage`) calls these functions — none of them import mock
data directly anymore. The old `src/data/dashboardData.ts` was deleted.

Right now each service function's body returns mock data. **Step 12's job is to swap only the internals
of these functions to call the real FastAPI backend — component code should not need to change.**

## What's NOT done yet (remaining steps, in order)
12. Connect all screens to the real FastAPI backend — replace mock internals of the service functions
    above with real `fetch`/React Query calls to actual endpoints. Do not change how components call them.
13. WebSocket live detection/tracking updates, with camera reconnect/backoff logic.
14. Full error handling, empty states, offline handling, responsive + accessibility pass.
15. Unit tests for components, integration tests for API/WebSocket flows.
16. Deployment config — Dockerfile, env vars for API/WebSocket URLs, CI/CD.

## First thing to do in this session
Before writing any code, list the current contents of `src/services/`, `src/types/`, and `src/pages/` (or
run/describe the project's actual file tree) and confirm back to me that you're reading the real existing
code in this repo — not starting fresh or assuming file names. Then continue with step 12.
