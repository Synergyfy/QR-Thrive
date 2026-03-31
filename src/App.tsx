import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GeneratorPage from './pages/GeneratorPage';
import DynamicPage from './pages/DynamicPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Generator App */}
        <Route path="/" element={<GeneratorPage />} />

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
