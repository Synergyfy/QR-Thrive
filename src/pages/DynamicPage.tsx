import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DynamicView from '../components/DynamicView';
import type { QRData } from '../types/qr';

// This is a simple mock database for now
const MOCK_DB: Record<string, QRData> = {
  '7KxR9p': {
    type: 'url',
    url: 'https://www.google.com',
  },
};

const DynamicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Try to find the data in localStorage first, then fallback to mock DB
  const storedData = id ? localStorage.getItem(`qr_data_${id}`) : null;
  const data = (storedData ? JSON.parse(storedData) as QRData : (id ? MOCK_DB[id] : null)) as QRData | null;

  useEffect(() => {
    if (!data) return;

    // Check if the type should redirect directly
    const directRedirectTypes = ['url', 'whatsapp', 'email', 'phone', 'sms'];
    
    if (directRedirectTypes.includes(data.type)) {
      let targetUrl = '';
      
      switch (data.type) {
        case 'url':
          targetUrl = data.url || '';
          break;
        case 'whatsapp':
          targetUrl = `https://wa.me/${data.whatsapp?.number}?text=${encodeURIComponent(data.whatsapp?.message || '')}`;
          break;
        case 'email':
          targetUrl = `mailto:${data.email?.address}?subject=${encodeURIComponent(data.email?.subject || '')}&body=${encodeURIComponent(data.email?.body || '')}`;
          break;
        case 'phone':
          targetUrl = `tel:${data.phone?.number}`;
          break;
        case 'sms':
          targetUrl = `sms:${data.sms?.number}?body=${encodeURIComponent(data.sms?.message || '')}`;
          break;
      }

      if (targetUrl) {
         // Use window.location.replace to keep the history clean
         window.location.replace(targetUrl);
      }
    }
  }, [data]);

  if (!data) {
    return <Navigate to="/" replace />;
  }

  // Define types that should show the landing page
  const showLandingPageTypes = ['socials', 'text', 'vcard', 'crypto', 'event', 'instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'];
  
  if (showLandingPageTypes.includes(data.type)) {
    return <DynamicView data={data} />;
  }

  // Fallback for direct redirect types while the useEffect is triggering
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 font-medium">Redirecting you to the destination...</p>
      </div>
    </div>
  );
};

export default DynamicPage;
