import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GeneratorPage from './pages/GeneratorPage';
import DynamicPage from './pages/DynamicPage';
import DashboardPage from './pages/DashboardPage';
import CreationWizard from './pages/CreationWizard';
import SubmissionsPage from './pages/SubmissionsPage';
import ProtectedRoute from './components/ProtectedRoute';
import PricingPage from './pages/PricingPage';
import AdminLayout from './pages/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import UsersManagement from './pages/admin/Users';
import PricingManager from './pages/admin/PricingManager';
import SettingsPage from './pages/admin/Settings';
import WhyUsPage from './pages/WhyUsPage';
import SolutionsPage from './pages/SolutionsPage';
import FAQPage from './pages/FAQPage';
import FloatingChat from './components/FloatingChat';
import AdminChat from './pages/admin/AdminChat';


import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
      <FloatingChat />
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
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/why-us" element={<WhyUsPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/faq" element={<FAQPage />} />

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

        {/* Admin Dashboard Area */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="pricing" element={<PricingManager />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="support" element={<AdminChat />} />
        </Route>

        {/* Catch-all for 404s */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
