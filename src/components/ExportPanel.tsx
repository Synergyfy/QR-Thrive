import React from 'react';
import { Download, FileImage, FileType } from 'lucide-react';
import { useQRCode } from '../hooks/useQRCode';
import type { QRConfiguration } from '../types/qr';

interface ExportPanelProps {
  config: QRConfiguration;
  hasUser: boolean;
  onAuthRequired: () => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ config, hasUser, onAuthRequired }) => {
  const { download } = useQRCode(config);

  const handleDownload = (type: 'png' | 'svg' | 'jpeg') => {
    if (!hasUser) {
      onAuthRequired();
    } else {
      download(type);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <button
        onClick={() => handleDownload('svg')}
        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-[24px] font-bold text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95 group"
      >
        <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
        Download Vector (SVG)
      </button>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleDownload('png')}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 hover:shadow-xl hover:border-blue-100 transition-all shadow-sm active:scale-95 text-xs uppercase tracking-widest"
        >
          <FileImage className="w-4 h-4 text-blue-600" />
          PNG Image
        </button>
        <button
          onClick={() => handleDownload('jpeg')}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 hover:shadow-xl hover:border-blue-100 transition-all shadow-sm active:scale-95 text-xs uppercase tracking-widest"
        >
          <FileType className="w-4 h-4 text-blue-600" />
          JPEG Format
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
