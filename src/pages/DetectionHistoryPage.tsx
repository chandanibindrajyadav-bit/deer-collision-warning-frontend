import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import type { Camera, RiskLevel, TrackSnapshot } from '../types'
import { getCameras } from '../services/cameras'
import { getTrackSnapshots } from '../services/tracks'
import { CameraViewport } from './LiveMonitoringPage'

type SortKey = 'trackId' | 'camera' | 'riskLevel' | 'timestamp' | 'confidence' | 'warningScore'
type TimeFilter = 'all' | 'today' | '24h' | '7d'

type HistoryRecord = TrackSnapshot & { camera: Camera }

const riskRank: Record<RiskLevel, number> = { high_risk: 0, safe: 1 }

function cameraFor(snapshot: TrackSnapshot) {
  const cameras = getCameras()
  return cameras.find((camera) => camera.id === snapshot.detection.cameraId) ?? cameras[0]
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp))
}

function formatRisk(risk: RiskLevel) {
  return risk === 'high_risk' ? 'High Risk' : 'Safe'
}

function csvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function DetectionHistoryPage() {
  const cameras = getCameras()
  const [search, setSearch] = useState('')
  const [cameraId, setCameraId] = useState('all')
  const [riskLevel, setRiskLevel] = useState<RiskLevel | 'all'>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const records = useMemo<HistoryRecord[]>(() => getTrackSnapshots().map((snapshot) => ({ ...snapshot, camera: cameraFor(snapshot) })), [])
  const filteredRecords = useMemo(() => {
    const now = new Date('2026-09-23T12:00:00Z').getTime()
    const timeCutoff: Record<TimeFilter, number> = { all: 0, today: now - 24 * 60 * 60 * 1000, '24h': now - 24 * 60 * 60 * 1000, '7d': now - 7 * 24 * 60 * 60 * 1000 }
    const normalizedSearch = search.trim().toLowerCase()

    return records
      .filter((record) => !normalizedSearch || record.detection.trackId.toLowerCase().includes(normalizedSearch) || record.camera.name.toLowerCase().includes(normalizedSearch))
      .filter((record) => cameraId === 'all' || record.camera.id === cameraId)
      .filter((record) => riskLevel === 'all' || record.collisionRisk.riskLevel === riskLevel)
      .filter((record) => new Date(record.timestamp).getTime() >= timeCutoff[timeFilter])
      .sort((left, right) => {
        const leftValue = sortKey === 'trackId' ? left.detection.trackId : sortKey === 'camera' ? left.camera.name : sortKey === 'riskLevel' ? riskRank[left.collisionRisk.riskLevel] : sortKey === 'timestamp' ? new Date(left.timestamp).getTime() : sortKey === 'confidence' ? left.detection.confidence : left.collisionRisk.warningScore
        const rightValue = sortKey === 'trackId' ? right.detection.trackId : sortKey === 'camera' ? right.camera.name : sortKey === 'riskLevel' ? riskRank[right.collisionRisk.riskLevel] : sortKey === 'timestamp' ? new Date(right.timestamp).getTime() : sortKey === 'confidence' ? right.detection.confidence : right.collisionRisk.warningScore
        const comparison = typeof leftValue === 'string' ? leftValue.localeCompare(rightValue as string) : leftValue - (rightValue as number)
        return sortDirection === 'asc' ? comparison : -comparison
      })
  }, [cameraId, records, riskLevel, search, sortDirection, sortKey, timeFilter])

  const highRiskCount = filteredRecords.filter((record) => record.collisionRisk.riskLevel === 'high_risk').length
  const averageConfidence = filteredRecords.length ? Math.round(filteredRecords.reduce((sum, record) => sum + record.detection.confidence, 0) / filteredRecords.length * 100) : 0

  function changeSort(nextKey: SortKey) {
    if (nextKey === sortKey) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else { setSortKey(nextKey); setSortDirection(nextKey === 'timestamp' ? 'desc' : 'asc') }
  }

  function resetFilters() {
    setSearch(''); setCameraId('all'); setRiskLevel('all'); setTimeFilter('all')
  }

  function exportCsv() {
    const header = ['Track ID', 'Detection ID', 'Camera', 'Timestamp', 'Confidence', 'Speed', 'Heading', 'Predicted Crossing Point', 'Risk Level', 'Warning Score', 'Behavior']
    const rows = filteredRecords.map((record) => [record.detection.trackId, record.detection.id, record.camera.name, record.timestamp, `${Math.round(record.detection.confidence * 100)}%`, `${record.collisionRisk.speed} m/s`, `${record.collisionRisk.headingAngle}°`, record.collisionRisk.predictedCrossingPoint ? `${record.collisionRisk.predictedCrossingPoint.x}, ${record.collisionRisk.predictedCrossingPoint.y}` : 'None', formatRisk(record.collisionRisk.riskLevel), `${Math.round(record.collisionRisk.warningScore * 100)}%`, record.behavior?.description ?? 'No behavior analysis'])
    downloadBlob([header, ...rows].map((row) => row.map(csvValue).join(',')).join('\n'), 'deer-track-history.csv', 'text/csv;charset=utf-8')
  }

  function exportPdf() {
    setIsExporting(true)
    const pdf = new jsPDF()
    pdf.setFontSize(18); pdf.text('Deer Detection & Track History', 14, 18)
    pdf.setFontSize(9); pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)
    pdf.text(`Filters: ${riskLevel === 'all' ? 'All risks' : formatRisk(riskLevel)} | ${cameraId === 'all' ? 'All cameras' : cameraId} | ${timeFilter}`, 14, 32)
    let y = 43
    filteredRecords.forEach((record, index) => {
      if (y > 275) { pdf.addPage(); y = 18 }
      pdf.setFontSize(10); pdf.text(`${index + 1}. ${record.detection.trackId} | ${record.camera.name} | ${formatRisk(record.collisionRisk.riskLevel)}`, 14, y)
      pdf.setFontSize(8); pdf.text(`${formatDate(record.timestamp)} | Confidence ${Math.round(record.detection.confidence * 100)}% | Score ${Math.round(record.collisionRisk.warningScore * 100)}%`, 14, y + 6)
      pdf.text(`Behavior: ${record.behavior?.description ?? 'No behavior analysis'}`, 14, y + 12, { maxWidth: 180 })
      y += 23
    })
    pdf.save('deer-track-history.pdf')
    setIsExporting(false)
  }

  return (
    <section className="history-page" aria-labelledby="history-title">
      <div className="page-heading"><div><p className="eyebrow">Historical review</p><h1 id="history-title">Detection &amp; track history</h1><p className="page-summary">Review ByteTrack events and collision-risk context from monitored deer tracks.</p></div><div className="history-actions"><button type="button" className="secondary-button" onClick={exportCsv} disabled={!filteredRecords.length}>Export CSV</button><button type="button" className="primary-button" onClick={exportPdf} disabled={!filteredRecords.length || isExporting}>{isExporting ? 'Exporting PDF' : 'Export PDF'}</button></div></div>
      <div className="summary-grid history-summary"><article className="summary-card"><span className="summary-label">Historical events</span><strong>{filteredRecords.length}</strong></article><article className="summary-card"><span className="summary-label">Unique tracks</span><strong>{new Set(filteredRecords.map((record) => record.detection.trackId)).size}</strong></article><article className="summary-card risk-summary-card"><span className="summary-label">High-risk events</span><strong>{highRiskCount}</strong></article><article className="summary-card"><span className="summary-label">Average confidence</span><strong>{averageConfidence}%</strong></article></div>
      <section className="dashboard-panel history-panel"><div className="history-filters"><label>Search track or camera<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="track-88 or North Ridge" /></label><label>Camera<select value={cameraId} onChange={(event) => setCameraId(event.target.value)}><option value="all">All cameras</option>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label><label>Risk level<select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as RiskLevel | 'all')}><option value="all">All risks</option><option value="safe">Safe</option><option value="high_risk">High Risk</option></select></label><label>Time<select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}><option value="all">All time</option><option value="today">Today</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option></select></label></div><div className="history-table-wrap">{filteredRecords.length ? <table className="data-table history-table"><thead><tr>{[['trackId', 'Track ID'], ['camera', 'Camera'], ['timestamp', 'Time'], ['confidence', 'Confidence'], ['warningScore', 'Warning score'], ['riskLevel', 'Risk'], ['trackId', 'Actions']].map(([key, label], index) => <th key={`${key}-${index}`}>{index < 6 ? <button type="button" className="sort-button" onClick={() => changeSort(key as SortKey)}>{label} {sortKey === key && (sortDirection === 'asc' ? '↑' : '↓')}</button> : label}</th>)}</tr></thead><tbody>{filteredRecords.map((record) => <tr key={record.detection.id}><td><strong>{record.detection.trackId}</strong><small>{record.detection.id}</small></td><td>{record.camera.name}</td><td>{formatDate(record.timestamp)}</td><td>{Math.round(record.detection.confidence * 100)}%</td><td>{Math.round(record.collisionRisk.warningScore * 100)}%</td><td><span className={`risk-pill ${record.collisionRisk.riskLevel}`}>{formatRisk(record.collisionRisk.riskLevel)}</span></td><td><button type="button" className="table-action" onClick={() => setSelectedRecord(record)}>Details</button></td></tr>)}</tbody></table> : <div className="history-empty"><strong>No deer tracking events match your current filters.</strong><button type="button" className="secondary-button" onClick={resetFilters}>Reset filters</button></div>}</div></section>
      {selectedRecord && <HistoryDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </section>
  )
}

function HistoryDetails({ record, onClose }: { record: HistoryRecord; onClose: () => void }) {
  const { detection, trajectory, prediction, collisionRisk, behavior, camera } = record
  return <div className="modal-backdrop" role="presentation"><section className="history-details-modal" role="dialog" aria-modal="true" aria-labelledby="history-detail-title"><div className="panel-heading"><div><p className="panel-kicker">Track details</p><h2 id="history-detail-title">{detection.trackId}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close track details">X</button></div><div className="history-detail-visual"><CameraViewport camera={camera} snapshot={record} focused /></div><div className="detail-metrics"><span><small>Camera</small>{camera.name}</span><span><small>Timestamp</small>{formatDate(record.timestamp)}</span><span><small>Confidence</small>{Math.round(detection.confidence * 100)}%</span><span><small>Trajectory points</small>{trajectory.positions.length}</span><span><small>Predicted position</small>({prediction.predictedNextPosition.x}, {prediction.predictedNextPosition.y})</span><span><small>Speed / heading</small>{collisionRisk.speed} m/s / {collisionRisk.headingAngle}°</span><span><small>Warning score</small>{Math.round(collisionRisk.warningScore * 100)}%</span></div><p className="detail-behavior">{behavior ? `${behavior.behaviorLabel} — ${behavior.description}` : 'No behavior analysis was run for this safe track.'}</p></section></div>
}
