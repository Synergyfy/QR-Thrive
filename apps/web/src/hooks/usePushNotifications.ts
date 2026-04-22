/* src/hooks/usePushNotifications.ts */

import { useState } from 'react';
import { urlBase64ToUint8Array } from '../utils/push-utils';
import { useSubscribePush, useUpdateProfile } from './useApi';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const subscribePushMutation = useSubscribePush();
  const updateProfileMutation = useUpdateProfile();

  /**
   * Step 1: Subscribe the browser to the Push Service
   */
  const subscribeBrowser = async () => {
    setIsSubscribing(true);
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers are not supported in this browser');
      }

      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      // Send subscription object to backend
      await subscribePushMutation.mutateAsync(subscription);
      
      return true;
    } catch (err: any) {
      console.error('Failed to subscribe browser: ', err);
      toast.error(err.message || 'Failed to enable browser notifications');
      return false;
    } finally {
      setIsSubscribing(false);
    }
  };

  /**
   * Step 2: Toggle the 'scanNotificationsEnabled' preference in User Profile
   */
  const toggleUserPreference = async (enabled: boolean) => {
    try {
      await updateProfileMutation.mutateAsync({
        scanNotificationsEnabled: enabled
      });
      return true;
    } catch (err) {
      console.error('Failed to update user preference: ', err);
      return false;
    }
  };

  return { 
    subscribeBrowser, 
    toggleUserPreference, 
    loading: isSubscribing || subscribePushMutation.isPending || updateProfileMutation.isPending 
  };
};
