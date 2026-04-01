import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DynamicView from '../components/DynamicView';
import type { QRData } from '../types/qr';
import { useQRStorage } from '../hooks/useQRStorage';

const DynamicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { qrCodes, updateQR } = useQRStorage();
  
  // Find the stored QR code that matches this short ID
  const qrEntry = qrCodes.find(qr => qr.id === id);
  const data = qrEntry?.config.data as QRData | undefined;

  // Perform direct redirect as soon as possible if it's a direct redirect type
  if (qrEntry && data) {
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
        if (data.type === 'url' && !/^https?:\/\//i.test(targetUrl)) {
          targetUrl = 'https://' + targetUrl;
        }
        
        // Trigger redirect immediately
        window.location.replace(targetUrl);
        return null; // Don't render anything
      }
    }
  }

  useEffect(() => {
    if (qrEntry) {
      // Increment scan count
      updateQR(qrEntry.id, { scans: (qrEntry.scans || 0) + 1 });
    }
  }, [id]); // Only run when ID changes

  // If no data found at all, redirect to home
  if (!qrEntry) {
    return <Navigate to="/" replace />;
  }

  // Define types that should show the landing page
  const showLandingPageTypes = [
    'socials', 'text', 'vcard', 'crypto', 'event', 'instagram', 
    'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 
    'image', 'pdf', 'video', 'mp3', 'app', 'business', 'menu', 'wifi'
  ];
  
  if (showLandingPageTypes.includes(data?.type || '')) {
    return <DynamicView data={data as QRData} />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 font-medium">Redirecting you...</p>
      </div>
    </div>
  );
};

export default DynamicPage;
