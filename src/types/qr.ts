import type { DotType, CornerDotType, CornerSquareType, ErrorCorrectionLevel, Mode, TypeNumber, GradientType } from "qr-code-styling";

export type QRType = 
  | 'url' 
  | 'text' 
  | 'vcard' 
  | 'wifi' 
  | 'email' 
  | 'sms' 
  | 'whatsapp' 
  | 'phone' 
  | 'instagram' 
  | 'facebook' 
  | 'linkedin' 
  | 'twitter' 
  | 'youtube' 
  | 'tiktok' 
  | 'crypto' 
  | 'event';

export interface QRData {
  type: QRType;
  url?: string;
  text?: string;
  vcard?: {
    firstName: string;
    lastName: string;
    mobile: string;
    phone?: string;
    email: string;
    website?: string;
    address: string;
    company?: string;
    jobTitle?: string;
    note?: string;
  };
  wifi?: {
    ssid: string;
    password: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
  };
  email?: {
    address: string;
    subject: string;
    body: string;
  };
  sms?: {
    number: string;
    message: string;
  };
  whatsapp?: {
    number: string;
    message: string;
  };
  phone?: {
    number: string;
  };
  social?: {
    username: string;
    platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  };
  crypto?: {
    address: string;
    coin: 'bitcoin' | 'ethereum' | 'litecoin';
    amount?: string;
  };
  event?: {
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  };
}

export interface Gradient {
  type: GradientType;
  rotation: number;
  colorStops: { offset: number; color: string }[];
}

export interface QRDesignOptions {
  dots: {
    type: DotType;
    color: string;
    gradient?: Gradient;
  };
  cornersSquare: {
    type: CornerSquareType;
    color: string;
    gradient?: Gradient;
  };
  cornersDot: {
    type: CornerDotType;
    color: string;
    gradient?: Gradient;
  };
  background: {
    color: string;
    gradient?: Gradient;
  };
  imageOptions: {
    hideBackgroundDots: boolean;
    imageSize: number;
    margin: number;
  };
  qrOptions: {
    typeNumber: TypeNumber;
    mode: Mode;
    errorCorrectionLevel: ErrorCorrectionLevel;
  };
}

export interface QRFrameOptions {
  type: 'none' | 'simple' | 'text-below' | 'bubble' | 'ribbon' | 'bracket' | 'rounded-thick' | 'shadow';
  text?: string;
  color?: string;
  textColor?: string;
  font?: string;
}

export interface QRConfiguration {
  data: QRData;
  design: QRDesignOptions;
  logo?: string;
  frame: QRFrameOptions;
  width: number;
  height: number;
  margin: number;
  isDynamic: boolean;
  shortId?: string;
}
