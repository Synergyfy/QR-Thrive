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
  | 'socials'
  | 'links'
  | 'image'
  | 'event'
  | 'pdf'
  | 'video'
  | 'mp3'
  | 'app'
  | 'form'
  | 'business'
  | 'menu'
  | 'coupon';
  
export interface FileData {
  url: string;
  name?: string;
  size?: number;
  publicId?: string;
}

export interface PendingFile {
  file: File;
  signedUrl?: string;
}

export interface QRData {
  type: QRType;
  url?: string;
  text?: string;
  image?: {
    url: string;
    name?: string;
    size?: number;
    publicId?: string;
    caption?: string;
    pendingFile?: PendingFile;
  };
  images?: (FileData & { pendingFile?: PendingFile; caption?: string })[];
  pdf?: FileData & { pendingFile?: PendingFile };
  video?: {
    url: string;
    name?: string;
    size?: number;
    publicId?: string;
    platform?: 'youtube' | 'vimeo' | 'other';
    pendingFile?: PendingFile;
  };
  mp3?: FileData & { pendingFile?: PendingFile };
  app?: {
    ios?: string;
    android?: string;
  };
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
    number?: string;
    countryCode?: string;
    phoneNumber?: string;
    message: string;
  };
  phone?: {
    number: string;
  };
  social?: {
    username: string;
    platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok';
  };
  socials?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
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
  form?: {
    title: string;
    description?: string;
    fields: {
      id: string;
      type: 'text' | 'number' | 'range' | 'checkbox' | 'select' | 'radio' | 'email' | 'phone';
      label: string;
      placeholder?: string;
      helpText?: string;
      required: boolean;
      options?: { label: string; value: string }[];
      validation?: { min?: number; max?: number; step?: number };
      order: number;
    }[];
  };
  linksInfo?: {
    themeColor?: string;
    linkBgColor?: string;
    linkTextColor?: string;
    avatar?: string;
    title?: string;
    description?: string;
  };
  linksList?: {
    title: string;
    url: string;
    icon?: string;
  }[];
  business?: {
    themeColor?: string;
    companyName?: string;
    headline?: string;
    about?: string;
    logo?: string;
    banner?: string;
    contact?: {
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
    };
    socials?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
    openingHours?: {
      monday?: string;
      tuesday?: string;
      wednesday?: string;
      thursday?: string;
      friday?: string;
      saturday?: string;
      sunday?: string;
    };
  };
  menu?: {
    themeColor?: string;
    restaurantName?: string;
    description?: string;
    logo?: string;
    currency?: string;
    categories?: {
      id: string;
      name: string;
      items: {
        id: string;
        name: string;
        description?: string;
        price: number;
        image?: string;
        flags?: string[]; // e.g. vegan, spicy, gluten-free
      }[];
    }[];
  };
  coupon?: {
    themeColor?: string;
    title?: string;
    description?: string;
    discount?: string; // e.g. "20% OFF" or "$10 OFF"
    promoCode?: string;
    barcode?: string; // can be same as promo text, rendered as visual barcode
    validUntil?: string;
    terms?: string;
    banner?: string;
    companyName?: string;
    website?: string;
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
  type: 'none' | 'simple' | 'text-below' | 'bubble' | 'ribbon' | 'bracket' | 'rounded-thick' | 'shadow' | 'phone' | 'circular' | 'tag' | 'minimal';
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
