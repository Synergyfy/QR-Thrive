import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, QrCode, Archive, BarChart3, TrendingUp, User, Settings, Crown,
  Search, Plus, MoreVertical, Calendar, ExternalLink, Brush, Globe,
  ChevronDown, ChevronRight, Bell, FolderOpen, Trash2, Copy,
  RefreshCw, X, FolderPlus, ArrowRight, Edit3, Users, Download,
  Activity, Eye
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import { useFolders, useCreateFolder, useDeleteFolder, useQRCodes, useDeleteQRCode, useUpdateQRCode, useDuplicateQRCode, useCurrentUser, useLogout, useCancelSubscription } from '../hooks/useApi';
import type { BackendQRCode } from '../types/api';
import StatsPanel from '../components/StatsPanel';
import DashboardQRPreview from '../components/DashboardQRPreview';
import QRCodeStyling from 'qr-code-styling';
import { LogOut } from 'lucide-react';
import ScansModal from '../components/ScansModal';
import LeadsPanel from '../components/LeadsPanel';
import PricingPanel from '../components/panels/PricingPanel';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: userData } = useCurrentUser();
  const logoutMutation = useLogout();
  const user = userData?.user;
  
  const { data: folders = [] } = useFolders();
  const { data: qrCodes = [] } = useQRCodes();
  const cancelSubscriptionMutation = useCancelSubscription();
  const createFolderMutation = useCreateFolder();
  const deleteFolderMutation = useDeleteFolder();
  const deleteQRMutation = useDeleteQRCode();
  const updateQRMutation = useUpdateQRCode();
  const duplicateQRMutation = useDuplicateQRCode();

  const activeQRs = qrCodes.filter(qr => qr.status === 'active');
  const archivedQRs = qrCodes.filter(qr => qr.status === 'archived');
  const getQRsByFolder = (folderId: string) => qrCodes.filter(qr => qr.folderId === folderId && qr.status === 'active');

  const deleteQR = async (id: string) => {
    try {
      await deleteQRMutation.mutateAsync(id);
      toast.success('QR Code deleted');
    } catch (e) {
      toast.error('Failed to delete QR Code');
    }
  };

  const archiveQR = async (id: string) => {
    try {
      await updateQRMutation.mutateAsync({ id, data: { status: 'archived' }});
      toast.success('QR Code archived');
    } catch (e) {
      toast.error('Failed to archive QR Code');
    }
  };

  const unarchiveQR = async (id: string) => {
    try {
      await updateQRMutation.mutateAsync({ id, data: { status: 'active' }});
      toast.success('QR Code restored');
    } catch (e) {
      toast.error('Failed to restore QR Code');
    }
  };

  const duplicateQR = async (id: string) => {
    try {
      await duplicateQRMutation.mutateAsync(id);
      toast.success('QR Code duplicated');
    } catch (e) {
      toast.error('Failed to duplicate QR Code');
    }
  };

  const moveToFolder = async (qrId: string, folderId?: string) => {
    try {
      await updateQRMutation.mutateAsync({ id: qrId, data: { folderId: folderId || null } as any });
      toast.success(folderId ? 'Moved to folder' : 'Removed from folder');
    } catch (e) {
      toast.error('Failed to move QR Code');
    }
  };


  const createFolder = async (name: string) => {
    try {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const color = colors[folders.length % colors.length];
      await createFolderMutation.mutateAsync({ name, color });
      toast.success('Folder created');
    } catch (e) {
      toast.error('Failed to create folder');
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await deleteFolderMutation.mutateAsync(id);
      toast.success('Folder deleted');
    } catch (e) {
      toast.error('Failed to delete folder');
    }
  };

  const updateQRConfig = async (id: string, config: any) => {
    try {
      await updateQRMutation.mutateAsync({ id, data: { data: config.data, design: config.design, frame: config.frame, logo: config.logo, width: config.width, height: config.height, margin: config.margin } });
      toast.success('URL updated');
    } catch (e) {
      toast.error('Failed to update URL');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
    } catch (e) {
      toast.error('Logout failed');
    }
  };

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam) return tabParam;
    return user?.role !== 'ADMIN' && 
    user?.subscriptionStatus !== 'active' && 
    user?.subscriptionStatus !== 'non-renewing' && 
    user?.subscriptionStatus !== 'trialing' ? 'pricing' : 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const [editingURLQR, setEditingURLQR] = useState<string | null>(null);
  const [viewingScansQR, setViewingScansQR] = useState<{ id: string, name: string } | null>(null);
  const [newURLValue, setNewURLValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
        setFolderMenuOpen(null);
        setDownloadMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Determine which QRs to show
  const getDisplayedQRs = (): BackendQRCode[] => {
    let list: BackendQRCode[] = [];
    if (activeTab === 'all') list = qrCodes;
    else if (activeTab === 'active') list = activeQRs;
    else if (activeTab === 'archived') list = archivedQRs;
    else if (activeTab.startsWith('folder:')) {
      const folderId = activeTab.replace('folder:', '');
      list = getQRsByFolder(folderId);
    }
    else list = qrCodes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(qr => qr.name.toLowerCase().includes(q) || qr.type.toLowerCase().includes(q));
    }
    return list;
  };

  const displayedQRs = getDisplayedQRs();

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };



  const handleURLUpdate = () => {
    if (editingURLQR && newURLValue.trim()) {
      const qr = qrCodes.find(q => q.id === editingURLQR);
      if (qr && qr.config.data.type === 'url') {
        const updatedConfig = {
          ...qr.config,
          data: {
            ...qr.config.data,
            url: newURLValue.trim()
          }
        };
        updateQRConfig(editingURLQR, updatedConfig);
        setEditingURLQR(null);
        setNewURLValue('');
      }
    }
  };

  const handleDownload = async (qr: BackendQRCode, extension: 'png' | 'svg' | 'jpeg' | 'webp' = 'png') => {
    const qrData = qr.shortUrl.startsWith('http') 
      ? qr.shortUrl 
      : `${window.location.origin}${qr.shortUrl}`;

    // 1. Create the QR Code styling instance
    const qrCode = new QRCodeStyling({
      width: 1000,
      height: 1000,
      margin: 40,
      data: qrData,
      image: qr.config.logo,
      dotsOptions: {
        type: qr.config.design.dots.type,
        color: qr.config.design.dots.color,
        gradient: qr.config.design.dots.gradient,
      },
      backgroundOptions: {
        color: qr.config.design.background.color,
        gradient: qr.config.design.background.gradient,
      },
      cornersSquareOptions: {
        type: qr.config.design.cornersSquare.type,
        color: qr.config.design.cornersSquare.color,
        gradient: qr.config.design.cornersSquare.gradient,
      },
      cornersDotOptions: {
        type: qr.config.design.cornersDot.type,
        color: qr.config.design.cornersDot.color,
        gradient: qr.config.design.cornersDot.gradient,
      },
      imageOptions: qr.config.design.imageOptions,
      qrOptions: qr.config.design.qrOptions,
    });

    // 2. If no frame OR if SVG, just download directly (frames aren't supported in SVG export yet)
    if (qr.config.frame.type === 'none' || extension === 'svg') {
      qrCode.download({ name: qr.name, extension });
      return;
    }

    // 3. For framed QRs, we use a canvas to composite the final image
    const qrBlob = await qrCode.getRawData('png');
    if (!qrBlob) return;

    const qrImage = new Image();
    const url = URL.createObjectURL(qrBlob);
    
    qrImage.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const S = 2.5; // Scale factor from ~400px preview to 1000px download
      const frameType = qr.config.frame.type;
      const frameColor = qr.config.frame.color || '#000000';
      const frameText = qr.config.frame.text || '';
      const textColor = qr.config.frame.textColor || '#ffffff';
      const bgColor = qr.config.design.background.color || '#ffffff';
      
      // Calculate dimensions precisely
      const basePadding = 8 * S; // 2% of 400
      const innerGap = 8 * S; // p-2 centering
      
      let canvasWidth = 1000 + (basePadding + innerGap) * 2;
      let canvasHeight = 1000 + (basePadding + innerGap) * 2;
      let qrX = basePadding + innerGap;
      let qrY = basePadding + innerGap;

      // Adjust for specific frame borders/features
      let borderWidth = 0;
      let borderRadius = 0;

      switch (frameType) {
        case 'simple': borderWidth = 6 * S; borderRadius = 24 * S; break;
        case 'bubble': borderWidth = 16 * S; borderRadius = 60 * S; break;
        case 'rounded-thick': borderWidth = 24 * S; borderRadius = 40 * S; break;
        case 'shadow': borderWidth = 1 * S; borderRadius = 32 * S; break;
        case 'bracket': borderWidth = 3 * S; borderRadius = 8 * S; qrX += 10 * S; qrY += 10 * S; canvasWidth += 20 * S; canvasHeight += 20 * S; break;
        case 'ribbon': borderWidth = 10 * S; borderRadius = 16 * S; break;
        case 'phone': borderWidth = 12 * S; borderRadius = 48 * S; qrY += 20 * S; canvasHeight += 20 * S; break;
        case 'circular': borderRadius = canvasWidth / 2; break;
        case 'tag': borderWidth = 2 * S; borderRadius = 24 * S; qrY += 16 * S; canvasHeight += 16 * S; break;
        case 'minimal': borderWidth = 0; qrY += 10 * S; canvasHeight += 10 * S; break;
      }

      if (frameText) {
        canvasHeight += 120 * S; // Space for text element
      }

      canvas.width = canvasWidth + borderWidth * 2 + 100; // Adding buffer
      canvas.height = canvasHeight + borderWidth * 2 + 100;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 1. Draw Background
      ctx.fillStyle = bgColor;
      if (frameType === 'circular') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (1000 + 300) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw main container
        ctx.beginPath();
        ctx.roundRect(centerX - canvasWidth/2, centerY - canvasHeight/2, canvasWidth, canvasHeight, borderRadius);
        ctx.fill();
      }

      // 2. Draw the Frame
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = borderWidth;
      ctx.lineJoin = 'round';

      if (frameType !== 'none') {
        ctx.beginPath();
        if (frameType === 'circular') {
          ctx.arc(centerX, centerY, (1000 + 200) / 2, 0, Math.PI * 2);
          ctx.strokeStyle = frameColor + '33'; // 22 in hex is roughly 33 (0.2)
        } else if (frameType === 'tag') {
          ctx.roundRect(centerX - canvasWidth/2, centerY - canvasHeight/2, canvasWidth, canvasHeight, borderRadius);
          ctx.stroke();
          // Thicker top
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(centerX - canvasWidth/2, centerY - canvasHeight/2, canvasWidth, 32 * S, [borderRadius, borderRadius, 0, 0]);
          ctx.fill();
        } else if (frameType === 'minimal') {
          ctx.fillStyle = frameColor;
          ctx.fillRect(centerX - canvasWidth/2, centerY - canvasHeight/2, canvasWidth, 8 * S);
        } else if (frameType === 'bracket') {
          // Top-left bracket
          ctx.beginPath();
          ctx.moveTo(centerX - canvasWidth/2 + 100, centerY - canvasHeight/2);
          ctx.lineTo(centerX - canvasWidth/2, centerY - canvasHeight/2);
          ctx.lineTo(centerX - canvasWidth/2, centerY - canvasHeight/2 + 100);
          ctx.stroke();
          // ... (simplified for now, but focus on the main ones)
          ctx.strokeRect(centerX - canvasWidth/2, centerY - canvasHeight/2, canvasWidth, canvasHeight);
        } else if (frameType === 'shadow') {
          ctx.shadowBlur = 40 * S;
          ctx.shadowColor = frameColor + '55';
          ctx.strokeStyle = frameColor + '22';
          ctx.roundRect(centerX - canvasWidth/2, centerY - canvasHeight/2, canvasWidth, canvasHeight, borderRadius);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.roundRect(centerX - canvasWidth/2, centerY - canvasHeight/2, canvasWidth, canvasHeight, borderRadius);
          ctx.stroke();
        }
      }

      // 3. Draw the QR Code
      ctx.drawImage(qrImage, centerX - 500, centerY - canvasHeight/2 + qrY, 1000, 1000);

      // 4. Draw the Text Label
      if (frameText && frameType !== 'none') {
        ctx.font = `bold ${50 * S}px Inter, sans-serif`;
        const textWidth = ctx.measureText(frameText.toUpperCase()).width;
        const textX = centerX;
        const textY = centerY + canvasHeight/2 - (frameType === 'ribbon' ? 90 * S : 60 * S);

        if (frameType === 'ribbon') {
          ctx.fillStyle = frameColor;
          ctx.fillRect(centerX - canvasWidth/2, centerY + canvasHeight/2 - 180 * S, canvasWidth, 180 * S);
          ctx.fillStyle = textColor;
          ctx.fillText(frameText.toUpperCase(), textX, textY + 20 * S);
        } else {
          // Pill shape
          const pillWidth = Math.max(textWidth + 80 * S, 300 * S);
          const pillHeight = 100 * S;
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(textX - pillWidth/2, textY - pillHeight/2, pillWidth, pillHeight, 50 * S);
          ctx.fill();
          
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(frameText.toUpperCase(), textX, textY);
        }
      }

      // Download
      const mimeType = extension === 'jpeg' ? 'image/jpeg' : 'image/png';
      const link = document.createElement('a');
      link.download = `${qr.name}.${extension}`;
      link.href = canvas.toDataURL(mimeType);
      link.click();
      URL.revokeObjectURL(url);
    };
    
    qrImage.src = url;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTabLabel = () => {
    if (activeTab === 'all') return 'All QR Codes';
    if (activeTab === 'active') return 'Active QR Codes';
    if (activeTab === 'archived') return 'Archived QR Codes';
    if (activeTab === 'pricing') return 'Subscription Plans';
    if (activeTab.startsWith('folder:')) {
      const f = folders.find(fld => fld.id === activeTab.replace('folder:', ''));
      return f ? f.name : 'Folder';
    }
    return 'QR Codes';
  };

  const getTypeStyles = (type: string) => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {
      url:    { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
      social: { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' },
      vcard:  { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
      event:  { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
      pdf:    { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
      video:  { bg: 'bg-pink-50', text: 'text-pink-600', dot: 'bg-pink-500' },
      mp3:    { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
      app:    { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-500' },
      image:  { bg: 'bg-teal-50', text: 'text-teal-600', dot: 'bg-teal-500' },
      wifi:   { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
      email:  { bg: 'bg-sky-50', text: 'text-sky-600', dot: 'bg-sky-500' },
      sms:    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', dot: 'bg-fuchsia-500' },
    };
    return map[type.toLowerCase()] || { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };
  };

  const navItems = [
    { id: 'all', icon: QrCode, label: 'All Codes', count: qrCodes.length },
    { id: 'active', icon: LayoutGrid, label: 'Active', count: activeQRs.length },
    { id: 'archived', icon: Archive, label: 'Archived', count: archivedQRs.length },
    { id: 'stats', icon: BarChart3, label: 'Analytics' },
    { id: 'leads', icon: Users, label: 'Leads' },
    { id: 'pricing', icon: Crown, label: 'Plans' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">

      {/* ─── Sidebar ─── */}
      <aside className="w-[272px] bg-white/80 backdrop-blur-2xl border-r border-slate-200/50 flex flex-col h-screen sticky top-0 shrink-0 z-50">

        {/* Brand + CTA */}
        <div className="px-6 pt-6 pb-5 shrink-0 border-b border-slate-100/60">
          <div className="flex items-center cursor-pointer mb-6 group" onClick={() => navigate('/')}>
            <img
              src="/QRThrive_Logo_Full-BG.png"
              alt="QR Thrive"
              className="h-20 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
          <button 
            onClick={() => navigate('/dashboard/create')}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.97] shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Create QR Code
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">

          <div className="mb-6">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu</p>
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 group",
                    activeTab === item.id 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn(
                      "w-[18px] h-[18px] transition-colors",
                      activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                    )} />
                    <span className={cn(
                      "text-[13px]",
                      activeTab === item.id ? "font-semibold" : "font-medium"
                    )}>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={cn(
                      "text-[11px] font-semibold min-w-[22px] h-[22px] flex items-center justify-center rounded-md",
                      activeTab === item.id 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-slate-100 text-slate-500"
                    )}>{item.count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Folders / Collections */}
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Collections</p>
            <div className="space-y-0.5">
              {folders.map(folder => (
                <div key={folder.id} className="group flex items-center">
                  <button 
                    onClick={() => setActiveTab(`folder:${folder.id}`)}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-lg transition-all duration-150",
                      activeTab === `folder:${folder.id}` 
                        ? "bg-blue-50 text-blue-700 font-semibold" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-sm" style={{backgroundColor: folder.color}} />
                    <span className="truncate">{folder.name}</span>
                    <span className={cn(
                      "text-[11px] font-semibold ml-auto min-w-[22px] h-[22px] flex items-center justify-center rounded-md",
                      activeTab === `folder:${folder.id}` ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {getQRsByFolder(folder.id).length}
                    </span>
                  </button>
                  <button 
                    onClick={() => deleteFolder(folder.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 rounded-md hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {showNewFolder ? (
                <div className="flex items-center gap-2 px-3 py-2">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    placeholder="Folder name..."
                    className="flex-1 text-[13px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                  <button onClick={handleCreateFolder} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowNewFolder(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 text-[13px] font-medium hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all duration-150"
                >
                  <FolderPlus className="w-[18px] h-[18px]" /> Add Collection
                </button>
              )}
            </div>
          </div>

          {/* Utility Links */}
          <div className="border-t border-slate-100 pt-4 space-y-0.5">
            {[
              { icon: User, label: 'Profile' },
              { icon: Settings, label: 'Settings' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-slate-900 cursor-pointer transition-all hover:bg-slate-50 rounded-lg group">
                <item.icon className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600 transition-colors" />
                <span className="text-[13px] font-medium">{item.label}</span>
              </div>
            ))}
            <div 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all rounded-lg group"
            >
              <LogOut className="w-[18px] h-[18px] group-hover:text-red-500 transition-colors" />
              <span className="text-[13px] font-medium">Sign Out</span>
            </div>
          </div>

          {/* Subscription Widget */}
          <div className="mt-6 px-1">
            {user?.subscriptionStatus === 'trialing' ? (
              <div className="w-full p-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl space-y-4 shadow-xl shadow-blue-600/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-3xl rounded-full -mr-8 -mt-8" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Crown className="w-3.5 h-3.5 fill-white text-white" />
                    </div>
                    <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">Trial Active</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">
                      {user.trialEndsAt ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 0} days remaining
                    </p>
                    <p className="text-[11px] text-white/60">Full feature access</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('pricing')}
                    className="w-full py-2.5 bg-white text-blue-700 rounded-xl font-semibold text-[12px] hover:bg-blue-50 transition-all active:scale-[0.97]"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            ) : user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'non-renewing' ? (
              <div className="w-full p-4 bg-slate-900 rounded-2xl flex items-center justify-between group overflow-hidden relative">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-blue-400 fill-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">
                      {user?.subscriptionStatus === 'non-renewing' ? 'Ending Soon' : 'Active Plan'}
                    </p>
                    <p className="text-sm font-bold text-white leading-none mt-1">
                      {user?.plan?.name || 'Pro'} Subscriber
                    </p>
                  </div>
                </div>
                {user?.subscriptionStatus !== 'non-renewing' && (
                  <button 
                    onClick={() => { if(window.confirm('Cancel subscription?')) cancelSubscriptionMutation.mutate(); }}
                    className="relative z-20 p-2 text-slate-500 hover:text-red-400 transition-all rounded-lg hover:bg-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setActiveTab('pricing')}
                className="w-full p-5 bg-slate-900 rounded-2xl text-left group overflow-hidden relative hover:shadow-xl transition-all duration-300"
              >
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Crown className="w-4 h-4 fill-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{user?.plan?.name || 'Free'} Plan</span>
                  </div>
                  <p className="text-[15px] font-bold text-white leading-tight">Upgrade for analytics & dynamic links</p>
                  <div className="flex items-center gap-2 text-blue-400 text-[12px] font-semibold group-hover:gap-3 transition-all">
                    View Plans <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <Crown className="absolute -bottom-3 -right-3 w-20 h-20 text-white/5 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-8 relative z-50 shrink-0">
          <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-2 rounded-xl w-full max-w-md focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200 focus-within:shadow-sm transition-all duration-200 border border-transparent focus-within:border-blue-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search codes..." 
              className="bg-transparent text-[13px] font-medium text-slate-800 outline-none w-full placeholder:text-slate-400"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-slate-700 relative p-2 rounded-lg transition-all hover:bg-slate-100 group">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 border-[1.5px] border-white rounded-full" />
            </button>
            
            <div className="h-6 w-px bg-slate-200/50" />
            
            <div className="flex items-center gap-3 group cursor-pointer py-1.5 px-2 rounded-xl hover:bg-slate-50 transition-all duration-150">
              <img
                src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=4f46e5&color=fff&bold=true&size=64`}
                alt="Profile"
                className="w-8 h-8 rounded-lg shadow-sm"
              />
              <div className="hidden lg:block text-left">
                <p className="text-[13px] font-semibold text-slate-800 leading-none mb-0.5">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                </p>
                <p className="text-[11px] font-medium text-slate-400">{user?.role || 'Free'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-[1440px] mx-auto px-8 py-8 space-y-8">

            {/* Page Header */}
            <div className="flex items-end justify-between">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeTab === 'stats' ? 'Analytics' : activeTab === 'leads' ? 'Leads' : getTabLabel()}
                </h1>
                <p className="text-[14px] text-slate-500 font-medium">
                  {activeTab === 'stats' 
                    ? 'Track scan performance and visitor insights' 
                    : activeTab === 'leads'
                    ? 'Manage captured lead data'
                    : activeTab === 'pricing'
                    ? 'Choose the plan that fits your needs'
                    : `${displayedQRs.length} code${displayedQRs.length !== 1 ? 's' : ''} in this view`}
                </p>
              </div>
              {!['stats', 'leads', 'pricing'].includes(activeTab) && (
                <button
                  onClick={() => navigate('/dashboard/create')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Code
                </button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'pricing' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PricingPanel />
              </div>
            ) : activeTab === 'stats' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsPanel codes={qrCodes} />
              </div>
            ) : activeTab === 'leads' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LeadsPanel codes={qrCodes} />
              </div>
            ) : (
              <div className="animate-in fade-in duration-400 space-y-6">

                {/* ─── Stats Overview Cards ─── */}
                {(() => {
                  const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.scans || 0), 0);
                  const avgScans = qrCodes.length > 0 ? Math.round(totalScans / qrCodes.length) : 0;
                  const statsCards = [
                    { label: 'Total QR Codes', value: qrCodes.length, icon: QrCode, color: 'blue', change: '+12%' },
                    { label: 'Total Scans', value: totalScans.toLocaleString(), icon: Eye, color: 'emerald', change: '+8.2%' },
                    { label: 'Active Codes', value: activeQRs.length, icon: Activity, color: 'violet', change: '+3' },
                    { label: 'Avg. Scans / Code', value: avgScans.toLocaleString(), icon: TrendingUp, color: 'amber', change: '+5.1%' },
                  ];
                  const colorMap: Record<string, { iconBg: string; iconText: string; changeBg: string; changeText: string }> = {
                    blue:    { iconBg: 'bg-blue-50',    iconText: 'text-blue-600',    changeBg: 'bg-blue-50',    changeText: 'text-blue-600' },
                    emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', changeBg: 'bg-emerald-50', changeText: 'text-emerald-600' },
                    violet:  { iconBg: 'bg-violet-50',  iconText: 'text-violet-600',  changeBg: 'bg-violet-50',  changeText: 'text-violet-600' },
                    amber:   { iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   changeBg: 'bg-amber-50',   changeText: 'text-amber-600' },
                  };
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {statsCards.map((stat) => {
                        const c = colorMap[stat.color];
                        return (
                          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300/60 transition-all duration-200 group">
                            <div className="flex items-center justify-between mb-4">
                              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105', c.iconBg)}>
                                <stat.icon className={cn('w-5 h-5', c.iconText)} />
                              </div>
                              <span className={cn('text-[11px] font-semibold px-2 py-1 rounded-lg', c.changeBg, c.changeText)}>
                                {stat.change}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">{stat.value}</p>
                            <p className="text-[12px] font-medium text-slate-400">{stat.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Empty State */}
                {displayedQRs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-200/60 border-dashed relative group overflow-hidden">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                      <QrCode className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {activeTab === 'archived' ? 'No archived codes' : 'Create your first QR code'}
                    </h3>
                    <p className="text-[14px] text-slate-500 mb-8 max-w-sm mx-auto">
                      {activeTab === 'archived' 
                        ? 'Archived codes will appear here for safekeeping.' 
                        : 'Generate trackable, dynamic QR codes in seconds.'}
                    </p>
                    {activeTab !== 'archived' && (
                      <button 
                        onClick={() => navigate('/dashboard/create')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-[13px] flex items-center gap-2.5 shadow-lg shadow-blue-600/20 hover:shadow-xl active:scale-[0.97] transition-all"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" /> Get Started
                      </button>
                    )}
                  </div>
                )}

                {/* ─── QR Code Grid ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" ref={menuRef}>
                  {displayedQRs.map((qr) => {
                    const typeStyle = getTypeStyles(qr.type);
                    return (
                      <div 
                        key={qr.id} 
                        className={cn(
                          "group relative bg-white rounded-2xl border border-slate-200/60 transition-all duration-300 flex flex-col overflow-hidden",
                          "hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300",
                          qr.status === 'archived' && "opacity-50 hover:opacity-75"
                        )}
                      >
                        {/* Colored accent bar */}
                        <div className={cn('h-1 w-full', typeStyle.dot)} />

                        {/* ── QR Preview — centered & prominent ── */}
                        <div className="px-6 pt-5 pb-3">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md',
                                typeStyle.bg, typeStyle.text
                              )}>
                                {qr.type}
                              </span>
                              {qr.status === 'archived' && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Archived</span>
                              )}
                            </div>
                            {/* Menu */}
                            <div className="relative">
                              <button 
                                onClick={() => setMenuOpen(menuOpen === qr.id ? null : qr.id)} 
                                className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {menuOpen === qr.id && (
                                <div className="absolute top-8 right-0 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-[100] animate-in slide-in-from-top-1 fade-in duration-150">
                                  <button onClick={() => { navigate(`/dashboard/edit/${qr.id}/content`); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                                    <Edit3 className="w-4 h-4 text-slate-400" /> Edit Content
                                  </button>
                                  <button onClick={() => { navigate(`/dashboard/edit/${qr.id}/design`); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                                    <Brush className="w-4 h-4 text-slate-400" /> Edit Design
                                  </button>
                                  <button onClick={() => { duplicateQR(qr.id); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                                    <Copy className="w-4 h-4 text-slate-400" /> Duplicate
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  {folders.length > 0 && (
                                    <div className="relative">
                                      <button 
                                        onClick={() => setFolderMenuOpen(folderMenuOpen === qr.id ? null : qr.id)}
                                        className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors"
                                      >
                                        <FolderOpen className="w-4 h-4 text-slate-400" /> Move to...
                                        <ChevronRight className="w-3 h-3 ml-auto text-slate-400" />
                                      </button>
                                      {folderMenuOpen === qr.id && (
                                        <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-[101]">
                                          <button onClick={() => { moveToFolder(qr.id, undefined); setFolderMenuOpen(null); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 text-slate-500">
                                            No folder
                                          </button>
                                          {folders.map(f => (
                                            <button key={f.id} onClick={() => { moveToFolder(qr.id, f.id); setFolderMenuOpen(null); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: f.color}} />
                                              {f.name}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button onClick={() => { qr.status === 'archived' ? unarchiveQR(qr.id) : archiveQR(qr.id); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-indigo-600 transition-colors">
                                    <Archive className="w-4 h-4" /> {qr.status === 'archived' ? 'Restore' : 'Archive'}
                                  </button>
                                  <button onClick={() => { deleteQR(qr.id); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-red-50 flex items-center gap-3 text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Large QR Preview */}
                          <div className="flex justify-center mb-4">
                            <div className="w-[140px] h-[140px] bg-gradient-to-br from-slate-50 to-white rounded-2xl flex items-center justify-center p-3 border border-slate-100 group-hover:border-slate-200 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-slate-100/80 relative">
                              <DashboardQRPreview config={qr.config} shortUrl={qr.shortUrl} />
                            </div>
                          </div>

                          {/* Name + URL */}
                          <div className="text-center mb-3">
                            <h3 className="text-[15px] font-bold text-slate-900 truncate leading-snug mb-1 px-2">{qr.name}</h3>
                            <div className="flex items-center justify-center gap-1.5 text-slate-400">
                              <Globe className="w-3 h-3 shrink-0" />
                              <p className="text-[11px] font-medium truncate max-w-[200px]">{qr.shortUrl.replace(/^https?:\/\//, '')}</p>
                            </div>
                          </div>

                          {/* Mini Stats Row */}
                          <div className="flex items-center justify-center gap-4 mb-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                              <Calendar className="w-3 h-3" />
                              {formatDate(qr.updatedAt).split(',')[0]}
                            </div>
                            <div className="w-px h-3 bg-slate-200" />
                            <button 
                              onClick={() => setViewingScansQR({ id: qr.id, name: qr.name })}
                              className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <TrendingUp className="w-3 h-3" />
                              {qr.scans} scans
                            </button>
                          </div>
                        </div>

                        {/* ── Card Action Bar ── */}
                        <div className="flex items-center border-t border-slate-100 divide-x divide-slate-100 mt-auto">
                          <button 
                            onClick={() => window.open(qr.shortUrl, '_blank')} 
                            className="flex-1 py-3 text-[12px] font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 flex items-center justify-center gap-2 transition-all duration-150"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Preview
                          </button>
                          <div className="relative flex-1">
                            <button 
                              onClick={() => setDownloadMenuOpen(downloadMenuOpen === qr.id ? null : qr.id)} 
                              className="w-full py-3 text-[12px] font-semibold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50 flex items-center justify-center gap-2 transition-all duration-150"
                            >
                              <Download className="w-3.5 h-3.5" /> Export
                            </button>
                            {downloadMenuOpen === qr.id && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-[100] animate-in slide-in-from-bottom-2 fade-in duration-150">
                                {(['png', 'svg', 'jpeg', 'webp'] as const).map(ext => (
                                  <button 
                                    key={ext}
                                    onClick={() => { handleDownload(qr, ext); setDownloadMenuOpen(null); }} 
                                    className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 text-slate-700 uppercase flex items-center gap-2 transition-colors"
                                  >
                                    <div className="w-5 h-5 bg-slate-100 rounded text-[9px] font-bold flex items-center justify-center text-slate-500">.{ext}</div>
                                    {ext.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={() => navigate(`/dashboard/edit/${qr.id}/design`)} 
                            className="flex-1 py-3 text-[12px] font-semibold text-slate-500 hover:text-violet-600 hover:bg-violet-50/50 flex items-center justify-center gap-2 transition-all duration-150"
                          >
                            <Brush className="w-3.5 h-3.5" /> Design
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick URL Edit Modal */}
      {editingURLQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setEditingURLQR(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900">Update Destination</h3>
              </div>
              <button onClick={() => setEditingURLQR(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block">URL</label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    autoFocus
                    value={newURLValue}
                    onChange={(e) => setNewURLValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleURLUpdate()}
                    placeholder="https://example.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingURLQR(null)} className="flex-1 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-semibold text-[13px] hover:bg-slate-100 border border-slate-200 transition-all">Cancel</button>
                <button onClick={handleURLUpdate} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-[13px] hover:bg-blue-700 transition-all shadow-sm">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scans Analytics Modal */}
      {viewingScansQR && (
        <ScansModal 
          qrId={viewingScansQR.id} 
          qrName={viewingScansQR.name} 
          onClose={() => setViewingScansQR(null)} 
        />
      )}
    </div>
  );
};

export default DashboardPage;
