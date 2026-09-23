import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { UnauthorizedPage } from './pages/AccessPages'
import { CameraManagementPage } from './pages/CameraManagementPage'
import { DashboardPage } from './pages/DashboardPage'
import { DetectionHistoryPage } from './pages/DetectionHistoryPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AlertingPage } from './pages/AlertingPage'
import { LiveMonitoringPage } from './pages/LiveMonitoringPage'
import { LoginPage } from './pages/LoginPage'
import { UploadAnalysisPage } from './pages/UploadAnalysisPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/monitoring" element={<LiveMonitoringPage />} />
          <Route path="/upload-analysis" element={<UploadAnalysisPage />} />
          <Route path="/history" element={<DetectionHistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/alerts" element={<AlertingPage />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/cameras" element={<CameraManagementPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
