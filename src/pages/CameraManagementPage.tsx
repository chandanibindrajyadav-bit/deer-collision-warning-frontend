import { useState } from 'react'
import type { Camera, CameraStatus, CreateCameraInput } from '../types'
import { getCameras } from '../services/cameras'

const emptyForm: CreateCameraInput = {
  name: '',
  streamUrl: '',
  location: { latitude: 27.71, longitude: 85.32, zone: '' },
  roadBoundary: {
    name: '',
    thresholdMeters: 20,
    geometry: [
      { latitude: 27.71, longitude: 85.32 },
      { latitude: 27.715, longitude: 85.325 },
    ],
  },
  detectionEnabled: true,
}

const pinPositions: Record<string, { left: string; top: string }> = {
  'camera-north-ridge': { left: '30%', top: '24%' },
  'camera-creek-bed': { left: '54%', top: '42%' },
  'camera-east-trail': { left: '74%', top: '25%' },
  'camera-waterhole': { left: '62%', top: '72%' },
}

const statusLabels: Record<CameraStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
}

export function CameraManagementPage() {
  const initialCameras = getCameras()
  const [cameras, setCameras] = useState<Camera[]>(initialCameras)
  const [selectedCameraId, setSelectedCameraId] = useState(initialCameras[0].id)
  const [form, setForm] = useState<CreateCameraInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId)

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  function openEditForm(camera: Camera) {
    setEditingId(camera.id)
    setForm({
      name: camera.name,
      streamUrl: camera.streamUrl,
      location: camera.location,
      roadBoundary: camera.roadBoundary,
      detectionEnabled: camera.detectionEnabled,
    })
    setIsFormOpen(true)
  }

  function saveCamera() {
    if (!form.name.trim() || !form.streamUrl.trim() || !form.roadBoundary.name.trim()) return

    if (editingId) {
      setCameras((current) => current.map((camera) =>
        camera.id === editingId
          ? { ...camera, ...form, roadBoundary: { ...camera.roadBoundary, ...form.roadBoundary } }
          : camera,
      ))
    } else {
      const id = `camera-${Date.now()}`
      const camera: Camera = {
        id,
        name: form.name,
        streamUrl: form.streamUrl,
        location: form.location,
        roadBoundary: { id: `road-${id}`, ...form.roadBoundary },
        status: 'connecting',
        detectionEnabled: form.detectionEnabled ?? true,
      }
      setCameras((current) => [...current, camera])
      setSelectedCameraId(id)
    }

    setIsFormOpen(false)
  }

  function removeCamera(id: string) {
    setCameras((current) => current.filter((camera) => camera.id !== id))
    if (selectedCameraId === id) setSelectedCameraId(cameras.find((camera) => camera.id !== id)?.id ?? '')
  }

  return (
    <section className="camera-management-page" aria-labelledby="camera-management-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1 id="camera-management-title">Camera management</h1>
          <p className="page-summary">Manage monitoring points and the road boundaries used for deer proximity alerts.</p>
        </div>
        <button type="button" className="primary-button" onClick={openCreateForm}>Add camera</button>
      </div>

      <div className="camera-management-grid">
        <section className="dashboard-panel camera-directory" aria-labelledby="camera-directory-title">
          <div className="panel-heading">
            <div><p className="panel-kicker">Monitoring points</p><h2 id="camera-directory-title">Cameras</h2></div>
            <span className="data-badge">{cameras.length} total</span>
          </div>
          <div className="managed-camera-list">
            {cameras.map((camera) => (
              <button
                type="button"
                className={`managed-camera-row${selectedCameraId === camera.id ? ' selected' : ''}`}
                key={camera.id}
                onClick={() => setSelectedCameraId(camera.id)}
              >
                <span className={`camera-status-dot ${camera.status}`} aria-label={statusLabels[camera.status]} />
                <span className="camera-info"><strong>{camera.name}</strong><span>{camera.location?.zone ?? 'Unassigned zone'}</span></span>
                <span className={`camera-status-text ${camera.status}`}>{statusLabels[camera.status]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-panel camera-map-panel" aria-labelledby="camera-map-title">
          <div className="panel-heading">
            <div><p className="panel-kicker">Geospatial view</p><h2 id="camera-map-title">Camera zones</h2></div>
            <span className="map-legend"><span className="legend-line" /> Road boundary</span>
          </div>
          <div className="zone-map" aria-label="Schematic map showing camera locations and road boundary zones">
            <svg viewBox="0 0 800 440" role="img" aria-label="Camera pins and road geofence zones">
              <path className="map-road" d="M0 350 C180 290 230 340 365 260 S610 150 800 105" />
              <path className="map-road-secondary" d="M125 0 C205 120 350 145 405 235 S620 370 800 405" />
              {cameras.map((camera) => {
                const position = pinPositions[camera.id] ?? { left: '50%', top: '50%' }
                const left = Number.parseFloat(position.left)
                const top = Number.parseFloat(position.top)
                return (
                  <g key={camera.id} className={`map-zone ${selectedCameraId === camera.id ? 'selected' : ''}`} transform={`translate(${left * 8} ${top * 4.4})`}>
                    <circle className="zone-ring" r="42" />
                    <circle className={`map-pin ${camera.status}`} r="9" />
                    <text x="14" y="4">{camera.name}</text>
                  </g>
                )
              })}
            </svg>
          </div>
          {selectedCamera && <p className="map-caption"><strong>{selectedCamera.roadBoundary.name}</strong> · Alert threshold {selectedCamera.roadBoundary.thresholdMeters}m · {selectedCamera.roadBoundary.geometry.length} boundary points</p>}
        </section>
      </div>

      {selectedCamera && <section className="dashboard-panel camera-details" aria-labelledby="camera-details-title">
        <div className="panel-heading"><div><p className="panel-kicker">Selected camera</p><h2 id="camera-details-title">{selectedCamera.name}</h2></div><span className={`camera-status-text ${selectedCamera.status}`}>{statusLabels[selectedCamera.status]}</span></div>
        <div className="camera-detail-grid"><span><small>Zone</small>{selectedCamera.location?.zone}</span><span><small>Road boundary</small>{selectedCamera.roadBoundary.name}</span><span><small>Alert distance</small>{selectedCamera.roadBoundary.thresholdMeters} meters</span><span><small>Detection</small>{selectedCamera.detectionEnabled ? 'Enabled' : 'Disabled'}</span></div>
        <div className="route-links"><button type="button" className="secondary-button" onClick={() => openEditForm(selectedCamera)}>Edit camera</button><button type="button" className="secondary-button danger-action" onClick={() => removeCamera(selectedCamera.id)}>Remove camera</button></div>
      </section>}

      {isFormOpen && <div className="modal-backdrop" role="presentation"><section className="camera-form-modal" role="dialog" aria-modal="true" aria-labelledby="camera-form-title"><div className="panel-heading"><div><p className="panel-kicker">Camera configuration</p><h2 id="camera-form-title">{editingId ? 'Edit camera' : 'Add camera'}</h2></div><button type="button" className="icon-button" aria-label="Close camera form" onClick={() => setIsFormOpen(false)}>X</button></div><div className="camera-form-grid"><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Stream URL<input value={form.streamUrl} onChange={(event) => setForm({ ...form, streamUrl: event.target.value })} /></label><label>Monitoring zone<input value={form.location?.zone ?? ''} onChange={(event) => setForm({ ...form, location: { ...form.location, latitude: form.location?.latitude ?? 27.71, longitude: form.location?.longitude ?? 85.32, zone: event.target.value } })} /></label><label>Road boundary name<input value={form.roadBoundary.name} onChange={(event) => setForm({ ...form, roadBoundary: { ...form.roadBoundary, name: event.target.value } })} /></label><label>Alert threshold (meters)<input type="number" min="1" value={form.roadBoundary.thresholdMeters} onChange={(event) => setForm({ ...form, roadBoundary: { ...form.roadBoundary, thresholdMeters: Number(event.target.value) } })} /></label></div><div className="route-links"><button type="button" className="primary-button" onClick={saveCamera}>Save camera</button><button type="button" className="secondary-button" onClick={() => setIsFormOpen(false)}>Cancel</button></div></section></div>}
    </section>
  )
}
