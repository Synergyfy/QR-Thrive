import React from 'react';
import { X, Globe, Monitor, Smartphone, Tablet, Clock, MapPin } from 'lucide-react';
import { useScans } from '../hooks/useApi';

interface ScansModalProps {
  qrId: string;
  qrName: string;
  onClose: () => void;
}

const ScansModal: React.FC<ScansModalProps> = ({ qrId, qrName, onClose }) => {
  const { data: scans = [], isLoading } = useScans(qrId);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (device: string = 'desktop') => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none">Scan History</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">Detailed analytics for "{qrName}"</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">Loading scan data...</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                <Globe className="w-10 h-10 text-slate-200" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">No scans yet</h4>
              <p className="text-slate-400 max-w-xs mx-auto mt-2 font-medium">When people scan your QR code, their data will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-6 py-2 text-left">Date & Time</th>
                    <th className="px-6 py-2 text-left">Location</th>
                    <th className="px-6 py-2 text-left">Device / OS</th>
                    <th className="px-6 py-2 text-left">Browser</th>
                    <th className="px-6 py-2 text-left">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} className="group transition-all">
                      <td className="px-6 py-5 bg-slate-50/50 first:rounded-l-[24px] border-y border-transparent group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatDate(scan.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-slate-50/50 border-y border-transparent group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{scan.city || 'Unknown'}, {scan.country || 'Unknown'}</span>
                            <span className="text-[10px] font-bold text-slate-400">{scan.region || 'Unknown Region'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-slate-50/50 border-y border-transparent group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            {getDeviceIcon(scan.device)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 capitalize">{scan.device || 'Desktop'}</span>
                            <span className="text-[10px] font-bold text-slate-400">{scan.os || 'Unknown OS'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-slate-50/50 border-y border-transparent group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                        <span className="px-3 py-1.5 bg-white rounded-lg border border-slate-100 text-xs font-bold text-slate-600 shadow-sm">
                          {scan.browser || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-5 bg-slate-50/50 last:rounded-r-[24px] border-y border-transparent group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                        <code className="text-[11px] font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">
                          {scan.ip}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-xs font-bold text-slate-400">Showing {scans.length} total scans for this QR code.</p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScansModal;
