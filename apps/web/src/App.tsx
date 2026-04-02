import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GeneratorPage from './pages/GeneratorPage';
import DynamicPage from './pages/DynamicPage';
import DashboardPage from './pages/DashboardPage';
import CreationWizard from './pages/CreationWizard';
import SubmissionsPage from './pages/SubmissionsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
            padding: '16px 24px',
          },
        }}
      />
      <Routes>
        {/* Public Landing & Generator */}
        <Route path="/" element={<GeneratorPage />} />

        {/* Protected Dashboard Area */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/create" element={<CreationWizard />} />
          <Route path="/dashboard/edit/:id/:step" element={<CreationWizard />} />
          <Route path="/dashboard/qr/:id/submissions" element={<SubmissionsPage />} />
        </Route>

        {/* Dynamic Link Redirection */}
        {/* We use /s/ as the prefix for our short IDs */}
        <Route path="/s/:id" element={<DynamicPage />} />

        {/* Catch-all for 404s */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
