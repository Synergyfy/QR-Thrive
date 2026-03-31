import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GeneratorPage from './pages/GeneratorPage';
import DynamicPage from './pages/DynamicPage';
import DashboardPage from './pages/DashboardPage';
import CreationWizard from './pages/CreationWizard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing & Generator */}
        <Route path="/" element={<GeneratorPage />} />

        {/* Dashboard Area */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/create" element={<CreationWizard />} />
        <Route path="/dashboard/edit/:id/:step" element={<CreationWizard />} />

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
