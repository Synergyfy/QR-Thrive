import type { QRConfiguration } from './qr';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
}

export interface BackendFolder {
  id: string;
  name: string;
  color: string;
  _count: { qrCodes: number };
}

export interface CreateFolderDto {
  name: string;
  color: string;
}

export interface CreateQRCodeDto {
  name: string;
  description?: string;
  folderId?: string;
  type: string;
  isDynamic?: boolean;
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
}

export interface BackendQRCode {
  id: string;
  shortId: string;
  shortUrl: string;
  name: string;
  description?: string;
  folderId?: string;
  type: string;
  isDynamic: boolean;
  status: 'active' | 'archived';
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width: number;
  height: number;
  margin: number;
  createdAt: string;
  updatedAt: string;
  scans: number;
  form?: {
    _count: {
      submissions: number;
    };
  };
  config: QRConfiguration; // To make it easier for our UI
}

export interface Scan {
  id: string;
  qrCodeId: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  city?: string;
  country?: string;
  region?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalQRs: number;
  totalScans: number;
  uniqueVisitors: number;
  scansLastHour: number;
  deviceDist: Record<string, number>;
  osDist: Record<string, number>;
  browserDist: Record<string, number>;
  countryDist: Record<string, number>;
  timeDist: Record<string, number>;
  chartData: Array<{ name: string; scans: number; unique: number }>;
}
