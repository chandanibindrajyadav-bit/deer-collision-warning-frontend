import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RiskLevel } from '../types'
import { getCameras } from '../services/cameras'
import { getTrackSnapshots } from '../services/tracks'

type TimeFilter = 'all' | 'today' | '24h' | '7d'

const cameras = getCameras()
const trackSnapshots = getTrackSnapshots()

const MOCK_NOW = new Date('2026-09-23T12:00:00Z').getTime()
const riskColors: Record<RiskLevel, string> = { safe: '#70d49a', high_risk: '#dc806f' }
const tooltipStyle = { background: '#13231d', border: '1px solid rgba(198, 219, 194, 0.25)', color: '#edf4e9' }

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(timestamp))
}

function cutoffFor(filter: TimeFilter) {
  if (filter === 'today') {
    const start = new Date(MOCK_NOW)
    start.setHours(0, 0, 0, 0)
    return start.getTime()
  }
  if (filter === '24h') return MOCK_NOW - 24 * 60 * 60 * 1000
  if (filter === '7d') return MOCK_NOW - 7 * 24 * 60 * 60 * 1000
  return 0
}

export function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [cameraFilter, setCameraFilter] = useState('all')

  const filteredSnapshots = useMemo(() => trackSnapshots
    .filter((snapshot) => (cameraFilter === 'all' || snapshot.detection.cameraId === cameraFilter) && Date.parse(snapshot.timestamp) >= cutoffFor(timeFilter))
    .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)), [cameraFilter, timeFilter])

  const kpis = useMemo(() => {
    const total = filteredSnapshots.length
    const highRisk = filteredSnapshots.filter((snapshot) => snapshot.collisionRisk.riskLevel === 'high_risk').length
    return {
      detections: total,
      tracks: new Set(filteredSnapshots.map((snapshot) => snapshot.detection.trackId)).size,
      highRisk,
      safe: total - highRisk,
      confidence: total ? Math.round(filteredSnapshots.reduce((sum, item) => sum + item.detection.confidence, 0) / total * 100) : 0,
      warningScore: total ? Math.round(filteredSnapshots.reduce((sum, item) => sum + item.collisionRisk.warningScore, 0) / total * 100) : 0,
    }
  }, [filteredSnapshots])

  const timelineData = filteredSnapshots.map((snapshot) => ({
    time: formatTime(snapshot.timestamp),
    detections: 1,
    tracks: 1,
  }))

  const riskData = filteredSnapshots.map((snapshot) => ({
    time: formatTime(snapshot.timestamp),
    highRisk: snapshot.collisionRisk.riskLevel === 'high_risk' ? 1 : 0,
  }))

  const cameraData = cameras
    .filter((camera) => cameraFilter === 'all' || camera.id === cameraFilter)
    .map((camera) => {
      const records = filteredSnapshots.filter((snapshot) => snapshot.detection.cameraId === camera.id)
      return {
        camera: camera.name,
        events: records.length,
        highRisk: records.filter((snapshot) => snapshot.collisionRisk.riskLevel === 'high_risk').length,
      }
    })
    .filter((camera) => camera.events > 0)

  function resetFilters() {
    setTimeFilter('all')
    setCameraFilter('all')
  }

  return (
    <section className="analytics-page" aria-labelledby="analytics-title">
      <div className="page-heading analytics-heading">
        <div>
          <p className="eyebrow">Historical intelligence</p>
          <h1 id="analytics-title">Analytics</h1>
          <p className="page-summary">Deer detection, track activity, and collision-risk patterns across monitored cameras.</p>
        </div>
        <div className="analytics-filters">
          <label>Time range<select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}><option value="all">All time</option><option value="today">Today</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option></select></label>
          <label>Camera<select value={cameraFilter} onChange={(event) => setCameraFilter(event.target.value)}><option value="all">All cameras</option>{cameras.map((camera) => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label>
        </div>
      </div>

      <div className="summary-grid analytics-summary" aria-label="Analytics summary">
        <SummaryCard label="Total events" value={kpis.detections} />
        <SummaryCard label="Unique tracked deer" value={kpis.tracks} />
        <SummaryCard label="High-risk events" value={kpis.highRisk} isRisk />
        <SummaryCard label="Safe events" value={kpis.safe} />
        <SummaryCard label="Avg. confidence" value={`${kpis.confidence}%`} />
        <SummaryCard label="Avg. warning score" value={`${kpis.warningScore}%`} />
      </div>

      {filteredSnapshots.length > 0 ? <div className="analytics-chart-grid">
        <ChartPanel title="Detections and tracks over time" description="One point per filtered snapshot with second-level timestamps.">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={timelineData} margin={{ top: 12, right: 20, bottom: 28, left: 8 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="time" stroke="var(--muted)" tick={{ fontSize: 10 }} minTickGap={12} interval="preserveStartEnd"><Label value="Snapshot time" position="insideBottom" offset={-18} fill="var(--muted)" fontSize={11} /></XAxis><YAxis allowDecimals={false} stroke="var(--muted)" tick={{ fontSize: 10 }}><Label value="Count" angle={-90} position="insideLeft" fill="var(--muted)" fontSize={11} /></YAxis><Tooltip labelFormatter={(label) => `Snapshot: ${label}`} contentStyle={tooltipStyle} /><Legend verticalAlign="top" height={28} /><Line type="linear" dataKey="detections" name="Detection events" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /><Line type="linear" dataKey="tracks" name="Tracked deer" stroke="#8bb9e8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="High-risk event frequency" description="High-risk status at each real snapshot timestamp.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={riskData} margin={{ top: 12, right: 20, bottom: 28, left: 8 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="time" stroke="var(--muted)" tick={{ fontSize: 10 }} minTickGap={12} interval="preserveStartEnd"><Label value="Snapshot time" position="insideBottom" offset={-18} fill="var(--muted)" fontSize={11} /></XAxis><YAxis allowDecimals={false} domain={[0, 1]} ticks={[0, 1]} stroke="var(--muted)" tick={{ fontSize: 10 }}><Label value="High-risk events" angle={-90} position="insideLeft" fill="var(--muted)" fontSize={11} /></YAxis><Tooltip labelFormatter={(label) => `Snapshot: ${label}`} formatter={(value) => [value, 'High-risk events']} contentStyle={tooltipStyle} /><Bar dataKey="highRisk" name="High-risk events" fill={riskColors.high_risk} barSize={22} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Activity by camera" description="Total events compared with high-risk events per camera.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={cameraData} layout="vertical" margin={{ top: 12, right: 24, bottom: 28, left: 18 }} barCategoryGap="24%"><CartesianGrid stroke="var(--line)" horizontal={false} /><XAxis type="number" allowDecimals={false} stroke="var(--muted)" tick={{ fontSize: 10 }}><Label value="Event count" position="insideBottom" offset={-18} fill="var(--muted)" fontSize={11} /></XAxis><YAxis type="category" dataKey="camera" width={112} stroke="var(--muted)" tick={{ fontSize: 10 }}><Label value="Camera" angle={-90} position="insideLeft" offset={-4} fill="var(--muted)" fontSize={11} /></YAxis><Tooltip formatter={(value, name) => [value, name === 'events' ? 'Total events' : 'High-risk events']} contentStyle={tooltipStyle} /><Legend verticalAlign="top" height={28} /><Bar dataKey="events" name="Total events" fill="var(--accent)" radius={[0, 2, 2, 0]} /><Bar dataKey="highRisk" name="High-risk events" fill={riskColors.high_risk} radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer>
        </ChartPanel>
      </div> : <div className="analytics-empty"><strong>No analytics data matches the selected filters.</strong><button type="button" className="secondary-button" onClick={resetFilters}>Reset filters</button></div>}
    </section>
  )
}

function SummaryCard({ label, value, isRisk = false }: { label: string; value: string | number; isRisk?: boolean }) {
  return <article className={`summary-card${isRisk ? ' risk-summary-card' : ''}`}><span className="summary-label">{label}</span><strong>{value}</strong></article>
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="dashboard-panel chart-panel" aria-label={title}><div className="panel-heading"><div><p className="panel-kicker">Derived from filtered history</p><h2>{title}</h2><p className="chart-description">{description}</p></div></div><div className="chart-area">{children}</div></section>
}
