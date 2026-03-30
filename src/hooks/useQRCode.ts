import { useEffect, useRef, useState } from 'react';
import QRCodeStyling, { type Options } from 'qr-code-styling';
import type { QRConfiguration } from '../types/qr';

const getQRDataString = (config: QRConfiguration): string => {
  if (config.isDynamic && config.shortId) {
    return `https://qr-thrive.com/s/${config.shortId}`;
  }

  const { data } = config;
  switch (data.type) {
    case 'url': return data.url || '';
    case 'text': return data.text || '';
    case 'wifi':
      return `WIFI:S:${data.wifi?.ssid};T:${data.wifi?.encryption};P:${data.wifi?.password};;`;
    case 'email':
      return `mailto:${data.email?.address}?subject=${encodeURIComponent(data.email?.subject || '')}&body=${encodeURIComponent(data.email?.body || '')}`;
    case 'sms':
      return `SMSTO:${data.sms?.number}:${data.sms?.message}`;
    case 'whatsapp':
      return `https://wa.me/${data.whatsapp?.number}?text=${encodeURIComponent(data.whatsapp?.message || '')}`;
    case 'phone':
      return `tel:${data.phone?.number}`;
    case 'instagram':
      return `https://instagram.com/${data.social?.username}`;
    case 'facebook':
      return `https://facebook.com/${data.social?.username}`;
    case 'linkedin':
      return `https://linkedin.com/in/${data.social?.username}`;
    case 'twitter':
      return `https://twitter.com/${data.social?.username}`;
    case 'youtube':
      return `https://youtube.com/@${data.social?.username}`;
    case 'tiktok':
      return `https://tiktok.com/@${data.social?.username}`;
    case 'crypto':
      return data.crypto?.address || '';
    case 'event':
      return `BEGIN:VEVENT\nSUMMARY:${data.event?.title}\nLOCATION:${data.event?.location}\nDESCRIPTION:${data.event?.description}\nEND:VEVENT`;
    case 'vcard':
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.vcard?.firstName} ${data.vcard?.lastName}\nTEL;TYPE=CELL:${data.vcard?.mobile}\nEMAIL:${data.vcard?.email}\nADR:${data.vcard?.address}\nORG:${data.vcard?.company}\nTITLE:${data.vcard?.jobTitle}\nURL:${data.vcard?.website}\nNOTE:${data.vcard?.note}\nEND:VCARD`;
    default: return '';
  }
};

export const useQRCode = (config: QRConfiguration) => {
  const [qrCode] = useState<QRCodeStyling>(new QRCodeStyling());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current);
    }
  }, [qrCode, ref]);

  useEffect(() => {
    const options: Partial<Options> = {
      width: config.width,
      height: config.height,
      margin: config.margin,
      data: getQRDataString(config),
      image: config.logo,
      dotsOptions: {
        type: config.design.dots.type,
        color: config.design.dots.color,
        gradient: config.design.dots.gradient,
      },
      backgroundOptions: {
        color: config.design.background.color,
        gradient: config.design.background.gradient,
      },
      cornersSquareOptions: {
        type: config.design.cornersSquare.type,
        color: config.design.cornersSquare.color,
        gradient: config.design.cornersSquare.gradient,
      },
      cornersDotOptions: {
        type: config.design.cornersDot.type,
        color: config.design.cornersDot.color,
        gradient: config.design.cornersDot.gradient,
      },
      imageOptions: config.design.imageOptions,
      qrOptions: config.design.qrOptions,
    };

    qrCode.update(options);
  }, [config, qrCode]);

  const download = (extension: 'png' | 'svg' | 'jpeg') => {
    qrCode.download({ extension });
  };

  return { ref, download };
};
