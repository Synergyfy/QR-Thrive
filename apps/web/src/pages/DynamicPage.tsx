import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DynamicView from '../components/DynamicView';
import type { QRData } from '../types/qr';
import { qrCodesApi } from '../services/api';
import { useCurrentUser } from '../hooks/useApi';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:3005/api/v1');

const DynamicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { data: currentUser, isLoading: loadingAuth } = useCurrentUser();
  const searchParams = new URLSearchParams(window.location.search);
  const scanned = searchParams.get('scanned');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id || loadingAuth) return;
      
      const stored = localStorage.getItem(`qr_data_${id}`);

      // If user is not authenticated and it's a real scan (no local preview & not already bounced back)
      if (!currentUser && !scanned && !stored) {
        window.location.replace(`${API_URL}/qr-codes/scan/${id}`);
        return;
      }
      
      // 1. Try localStorage first (fast preview)
      if (stored) {
        try {
          setData(JSON.parse(stored) as QRData);
          setLoading(false);
          return;
        } catch (e) {}
      }

      // 2. Fetch from backend
      try {
        const qr = await qrCodesApi.getPublicQRCode(id);
        if (qr && qr.data) {
          setData(qr.data as QRData);
        }
      } catch (e) {
        console.error("Failed to fetch qr data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser, loadingAuth, scanned]);

  // Perform direct redirect as soon as possible if it's a direct redirect type
  if (data) {
    const directRedirectTypes = ['url', 'whatsapp', 'email', 'phone', 'sms'];
    
    if (directRedirectTypes.includes(data.type)) {
      let targetUrl = '';
      
      switch (data.type) {
        case 'url':
          targetUrl = data.url || '';
          break;
        case 'whatsapp':
          targetUrl = `https://wa.me/${(data.whatsapp?.phoneNumber ? (data.whatsapp?.countryCode || '').replace(/\D/g, '') + data.whatsapp.phoneNumber.replace(/\D/g, '').replace(/^0+/, '') : (data.whatsapp?.number || '').replace(/\D/g, ''))}?text=${encodeURIComponent(data.whatsapp?.message || '')}`;
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

  // If no data found at all
  if (loading || data === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">{loading ? 'Loading...' : 'Redirecting you...'}</p>
        </div>
      </div>
    );
  }

  // Define types that should show the landing page
  const showLandingPageTypes = [
    'socials', 'text', 'vcard', 'crypto', 'event', 'instagram', 
    'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 
    'image', 'pdf', 'video', 'mp3', 'app', 'business', 'menu', 'wifi', 'form'
  ];
  
  if (showLandingPageTypes.includes(data?.type || '')) {
    return <DynamicView data={data} />;
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
