import type { QRType } from './qr';

export const QRStatus = {
  active: 'active' as const,
  archived: 'archived' as const
} as const;

export type QRStatus = typeof QRStatus[keyof typeof QRStatus];

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

export interface BackendQRCode {
  id: string;
  shortId: string;
  name: string;
  description?: string;
  folderId?: string;
  type: QRType;
  isDynamic: boolean;
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width: number;
  height: number;
  margin: number;
  status: QRStatus;
  scans: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQRCodeDto {
  name: string;
  description?: string;
  folderId?: string;
  type: QRType;
  isDynamic?: boolean;
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
}

export interface UpdateQRCodeDto extends Partial<CreateQRCodeDto> {
  status?: QRStatus;
}

export interface DashboardStats {
  totalQRs: number;
  totalScans: number;
  uniqueVisitors: number;
  deviceDist: Record<string, number>;
  osDist: Record<string, number>;
  browserDist: Record<string, number>;
  chartData: Array<{ name: string; scans: number; unique: number }>;
}

export interface QRScanData {
  id: string;
  timestamp: string;
  deviceType?: string;
  location?: string;
  os?: string;
  browser?: string;
}

export interface DetailedQRCode extends BackendQRCode {
  scanHistory?: QRScanData[];
}
