# Copilot Prompt — YOLOvX Wildlife Monitoring Frontend

Paste the prompt below into Copilot / Copilot Chat to kick off the frontend build.

---

I'm building a wildlife detection and monitoring system frontend using **React + TypeScript**. The backend is a YOLOvX model served via **FastAPI**, with live camera feeds pushed over **WebSocket** and historical data via REST. Build this in stages, following the order below — do not skip ahead or bundle steps.

**Project context:**
The app monitors wildlife via CCTV/IP cameras and uploaded images/video. It detects animals, draws bounding boxes with confidence scores, counts animals per frame, logs detections, and alerts on critical events (e.g. low confidence, camera disconnect, or specific species). Users are forest authority staff (admin) and researchers (viewer).

**Tech choices to use:**
- React + TypeScript, functional components, hooks
- React Query (or SWR) for server state, Zustand for UI/session state
- React Router for routing
- Recharts or Chart.js for analytics
- Canvas overlay for bounding boxes on top of a video element (not re-rendering video frames as images)
- Tailwind CSS for styling
- Role-based route guards (admin vs viewer)

**Visual design requirements:**
- Dark-themed monitoring workspace for live video; dashboard/tables can support a light mode toggle
- Status colors used consistently everywhere: green = connected/high-confidence, amber = uncertain/low-confidence, red = critical/disconnected
- High-contrast bounding boxes with a label chip (species + confidence %)
- Dense, sortable, filterable data tables with sticky headers
- Skeleton loaders, empty states with CTAs, and offline/reconnect banners — no blank screens or silent failures
- Fully responsive: desktop (sidebar + camera grid), tablet (collapsible sidebar), mobile (single-camera focus + bottom nav)
- Accessible: ARIA labels on icons/status dots, full keyboard navigation, visible focus states, alt text on thumbnails

**Build in this exact order, one step at a time, and wait for me to confirm before moving to the next:**

1. Scaffold the React + TypeScript project with linting and a clean folder structure.
2. Define TypeScript types/interfaces matching the FastAPI response schemas for: detections, cameras, users, alerts. Set up React Query and Zustand.
3. Build authentication: login screen, role-based route guards (admin/viewer).
4. Build the app shell: sidebar, header, routing, and dark/light theme tokens.
5. Build the Dashboard screen using mock data: summary stats, recent detections, camera status overview.
6. Build Camera Management: add/edit/remove camera, plus a map view showing camera locations with live status pins.
7. Build Live Monitoring: single-camera focus view and a multi-camera grid view, with a canvas overlay for bounding boxes.
8. Build Upload Analysis: image/video upload with progress state, loading state during inference, and result display.
9. Build Detection History: filterable, sortable table with CSV/PDF export.
10. Build Analytics: charts for detections over time, by species, and by camera.
11. Build Alerting: configurable alert rules (confidence threshold, species, disconnect), toast/sound notifications, and an alert history/acknowledgment log.
12. Connect all screens to the real FastAPI backend, replacing mock data using the types from step 2.
13. Add WebSocket live detection updates, including camera reconnect/backoff logic on disconnect.
14. Add comprehensive error handling, empty states, offline handling, and a full responsive + accessibility pass.
15. Write unit tests for components and integration tests for API/WebSocket flows.
16. Add deployment config: Dockerfile, environment variables for API/WebSocket URLs, and CI/CD setup.

For the first usable version, focus only on steps 1–9 plus basic WebSocket support from step 13 — that's the MVP (Dashboard, Live Monitoring, Upload Analysis, Detection History, all backend-connected and live-updating). Confirm you understand this scope before writing any code.
