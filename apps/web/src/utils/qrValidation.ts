import type { QRData } from '../types/qr';

export const isQRDataValid = (data: QRData): boolean => {
  if (!data) return false;

  switch (data.type) {
    case 'url':
      return !!data.url && data.url.length > 3;
    case 'text':
      return !!data.text && data.text.length > 0;
    case 'vcard':
      return !!(data.vcard?.firstName || (data.vcard?.mobile || data.vcard?.email));
    case 'wifi':
      return !!data.wifi?.ssid;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !!data.email?.address && emailRegex.test(data.email.address);
    case 'sms':
      return !!data.sms?.number && data.sms.number.length > 3;
    case 'whatsapp':
      return (!!data.whatsapp?.number && data.whatsapp.number.length > 3) || 
             (!!data.whatsapp?.phoneNumber && data.whatsapp.phoneNumber.length > 3);
    case 'instagram':
    case 'facebook':
    case 'linkedin':
    case 'twitter':
    case 'youtube':
    case 'tiktok':
      return !!data.social?.username && data.social.username.length > 0;
    case 'crypto':
      return !!data.crypto?.address && data.crypto.address.length > 5;
    case 'event':
      return !!data.event?.title && data.event.title.length > 0;
    case 'socials':
      return !!data.socials && Object.values(data.socials).some(val => val && val.length > 0);
    case 'phone':
       return !!data.phone?.number && data.phone.number.length > 3;
    default:
      return true;
  }
};
