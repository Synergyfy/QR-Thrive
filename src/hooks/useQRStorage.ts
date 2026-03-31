import { useState, useEffect, useCallback } from 'react';
import type { QRConfiguration } from '../types/qr';

export interface StoredQR {
  id: string;
  name: string;
  type: string;
  config: QRConfiguration;
  createdAt: string;
  updatedAt: string;
  scans: number;
  status: 'active' | 'archived';
  folderId?: string;
  shortUrl: string;
}

export interface QRFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

const STORAGE_KEY = 'qr-thrive-codes';
const FOLDERS_KEY = 'qr-thrive-folders';

const generateId = () => Math.random().toString(36).substring(2, 10);
const generateShortUrl = (id: string) => `/s/${id}`;

const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    url: 'URL', text: 'Text', vcard: 'vCard', wifi: 'WiFi',
    email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp',
    socials: 'Socials', crypto: 'Crypto', event: 'Event',
    image: 'Image', pdf: 'PDF', video: 'Video', mp3: 'MP3', app: 'App',
    business: 'Business', menu: 'Menu',
  };
  return map[type] || type;
};

export const useQRStorage = () => {
  const [qrCodes, setQRCodes] = useState<StoredQR[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const codes: StoredQR[] = JSON.parse(stored);
      
      // MIGRATION: Fix broken short URLs from older versions
      const migrated = codes.map(qr => {
        if (!qr.shortUrl || qr.shortUrl.includes('qr.link')) {
           return { ...qr, shortUrl: generateShortUrl(qr.id) };
        }
        return qr;
      });
      return migrated;
    } catch (e) {
      console.error('Failed to load QR data', e);
      return [];
    }
  });

  // Persist migrated data on mount
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(qrCodes));
  }, []);

  const [folders, setFolders] = useState<QRFolder[]>(() => {
    try {
      const storedFolders = localStorage.getItem(FOLDERS_KEY);
      return storedFolders ? JSON.parse(storedFolders) : [];
    } catch (e) {
      console.error('Failed to load folders', e);
      return [];
    }
  });

  // Keep in sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) setQRCodes(JSON.parse(e.newValue));
      if (e.key === FOLDERS_KEY && e.newValue) setFolders(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const persistQRs = useCallback((codes: StoredQR[]) => {
    setQRCodes(codes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  }, []);

  const persistFolders = useCallback((f: QRFolder[]) => {
    setFolders(f);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(f));
  }, []);

  const saveQR = useCallback((config: QRConfiguration, name?: string): StoredQR => {
    const id = generateId();
    const newQR: StoredQR = {
      id,
      name: name || `${getTypeLabel(config.data.type)} QR Code`,
      type: getTypeLabel(config.data.type),
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scans: 0,
      status: 'active',
      shortUrl: generateShortUrl(id),
    };
    persistQRs([newQR, ...qrCodes]);
    return newQR;
  }, [qrCodes, persistQRs]);

  const updateQR = useCallback((id: string, updates: Partial<StoredQR>) => {
    const updated = qrCodes.map(qr =>
      qr.id === id ? { ...qr, ...updates, updatedAt: new Date().toISOString() } : qr
    );
    persistQRs(updated);
  }, [qrCodes, persistQRs]);

  const updateQRConfig = useCallback((id: string, config: QRConfiguration) => {
    updateQR(id, { config, type: getTypeLabel(config.data.type) });
  }, [updateQR]);

  const deleteQR = useCallback((id: string) => {
    persistQRs(qrCodes.filter(qr => qr.id !== id));
  }, [qrCodes, persistQRs]);

  const archiveQR = useCallback((id: string) => {
    updateQR(id, { status: 'archived' });
  }, [updateQR]);

  const unarchiveQR = useCallback((id: string) => {
    updateQR(id, { status: 'active' });
  }, [updateQR]);

  const duplicateQR = useCallback((id: string) => {
    const source = qrCodes.find(qr => qr.id === id);
    if (!source) return;
    const newId = generateId();
    const dup: StoredQR = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scans: 0,
      shortUrl: generateShortUrl(newId),
    };
    persistQRs([dup, ...qrCodes]);
  }, [qrCodes, persistQRs]);

  const moveToFolder = useCallback((qrId: string, folderId: string | undefined) => {
    updateQR(qrId, { folderId });
  }, [updateQR]);

  const renameQR = useCallback((id: string, name: string) => {
    updateQR(id, { name });
  }, [updateQR]);

  const getQR = useCallback((id: string): StoredQR | undefined => {
    return qrCodes.find(qr => qr.id === id);
  }, [qrCodes]);

  const createFolder = useCallback((name: string): QRFolder => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const folder: QRFolder = {
      id: generateId(),
      name,
      color: colors[folders.length % colors.length],
      createdAt: new Date().toISOString(),
    };
    persistFolders([...folders, folder]);
    return folder;
  }, [folders, persistFolders]);

  const deleteFolder = useCallback((id: string) => {
    const updatedQRs = qrCodes.map(qr =>
      qr.folderId === id ? { ...qr, folderId: undefined } : qr
    );
    persistQRs(updatedQRs);
    persistFolders(folders.filter(f => f.id !== id));
  }, [qrCodes, folders, persistQRs, persistFolders]);

  const renameFolder = useCallback((id: string, name: string) => {
    persistFolders(folders.map(f => f.id === id ? { ...f, name } : f));
  }, [folders, persistFolders]);

  const activeQRs = qrCodes.filter(qr => qr.status === 'active');
  const archivedQRs = qrCodes.filter(qr => qr.status === 'archived');
  const getQRsByFolder = (folderId: string) => qrCodes.filter(qr => qr.folderId === folderId && qr.status === 'active');

  return {
    qrCodes,
    folders,
    activeQRs,
    archivedQRs,
    getQRsByFolder,
    saveQR,
    updateQR,
    updateQRConfig,
    deleteQR,
    archiveQR,
    unarchiveQR,
    duplicateQR,
    moveToFolder,
    renameQR,
    getQR,
    createFolder,
    deleteFolder,
    renameFolder,
  };
};
