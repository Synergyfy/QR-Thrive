import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, QrCode, Archive, BarChart3, TrendingUp, User, Settings, Crown,
  Search, Plus, MoreVertical, Calendar, ExternalLink, Brush, Globe,
  ChevronDown, ChevronRight, Bell, FolderOpen, Trash2, Copy,
  RefreshCw, X, FolderPlus, ArrowRight, Edit3, Users, Download,
  Activity, Eye, Shield, Mail, Key, Lock, Camera, MapPin,
  Smartphone, AlertTriangle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import { useFolders, useCreateFolder, useDeleteFolder, useQRCodes, useDeleteQRCode, useUpdateQRCode, useDuplicateQRCode, useCurrentUser, useLogout, useCancelSubscription, useUpdateProfile } from '../hooks/useApi';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { uploadPendingFile } from '../utils/upload';
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

  useEffect(() => {
    if (user) {
      console.log('Current user avatar:', user.avatar);
    }
  }, [user]);
  
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
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Settings hooks
  const updateProfileMutation = useUpdateProfile();
  const { subscribeBrowser, toggleUserPreference, loading: pushLoading } = usePushNotifications();

  // Settings values from user data
  const emailNotifs = user?.emailNotificationsEnabled ?? false;
  const pushNotifs = user?.scanNotificationsEnabled ?? false;
  const weeklyDigest = user?.weeklyDigestEnabled ?? false;
  const twoFactorEnabled = user?.twoFactorEnabled ?? false;

  const handleTogglePush = async () => {
    const nextState = !pushNotifs;
    console.log('[Push] handleTogglePush called, current pushNotifs:', pushNotifs, 'nextState:', nextState);
    if (nextState) {
      console.log('[Push] Attempting to subscribe browser...');
      const success = await subscribeBrowser();
      console.log('[Push] Subscribe browser result:', success);
      if (!success) return;
    }
    console.log('[Push] Updating scanNotificationsEnabled (Push) to:', nextState);
    await toggleUserPreference(nextState);
    console.log('[Push] User preference update complete');
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    console.log('[Settings] handleToggleSetting called:', { key, value });
    try {
      await updateProfileMutation.mutateAsync({ [key]: value });
      console.log('[Settings] handleToggleSetting success for key:', key);
    } catch (err) {
      console.error('[Settings] handleToggleSetting failed for key:', key, err);
    }
  };

  const [editingURLQR, setEditingURLQR] = useState<string | null>(null);
  const [viewingQR, setViewingQR] = useState<BackendQRCode | null>(null);
  const [viewingScansQR, setViewingScansQR] = useState<{ id: string, name: string } | null>(null);

  const copyToClipboard = (text: string) => {
    const fullUrl = text.startsWith('http') ? text : `${window.location.origin}${text}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard');
  };
  const [newURLValue, setNewURLValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    console.log('Starting photo upload to Cloudinary...');
    try {
      const result = await uploadPendingFile({ file }, 'image');
      if (result) {
        console.log('Photo upload successful:', result.url);
        await updateProfileMutation.mutateAsync({ avatar: result.url });
        toast.success('Profile photo updated');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
        setFolderMenuOpen(null);
        setDownloadMenuOpen(null);
        setHeaderMenuOpen(false);
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
    <div className="min-h-screen max-w-[100vw] bg-[#f5f6f8] flex font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden overflow-y-hidden relative">

      {/* ─── Mobile Sidebar Overlay ─── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={cn(
        "bg-white/80 backdrop-blur-2xl border-r border-slate-200/50 flex flex-col h-screen sticky top-0 shrink-0 z-[70] transition-all duration-300",
        "fixed lg:sticky lg:translate-x-0 w-[272px]",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:flex"
      )}>

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
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
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
                    onClick={() => { setActiveTab(`folder:${folder.id}`); setIsMobileMenuOpen(false); }}
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
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
               <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <item.icon className={cn(
                  "w-[18px] h-[18px] transition-colors",
                  activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className={cn(
                  "text-[13px]",
                  activeTab === item.id ? "font-semibold" : "font-medium"
                )}>{item.label}</span>
              </button>
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
                    onClick={() => { setActiveTab('pricing'); setIsMobileMenuOpen(false); }}
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
                      {user?.plan?.name || 'Pro'} 
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
                onClick={() => { setActiveTab('pricing'); setIsMobileMenuOpen(false); }}
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
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">

         {/* Top Bar */}
        <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-3 sm:px-8 relative z-50 shrink-0 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/80 px-3 sm:px-4 py-2 rounded-xl flex-1 min-w-0 max-w-md focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200 focus-within:shadow-sm transition-all duration-200 border border-transparent focus-within:border-blue-200">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder="Search codes..." 
              className="bg-transparent text-[13px] font-medium text-slate-800 outline-none w-full min-w-0 placeholder:text-slate-400"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
            <button className="text-slate-400 hover:text-slate-700 relative p-2 rounded-lg transition-all hover:bg-slate-100 group">
              <Bell className="w-5 h-5" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 border-[1.5px] border-white rounded-full" />
            </button>
            
            <div className="h-6 w-px bg-slate-200/50 hidden sm:block" />
            
            <div className="relative">
              <div 
                onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                className="flex items-center gap-3 group cursor-pointer py-1.5 px-2 rounded-xl hover:bg-slate-50 transition-all duration-150"
              >
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=4f46e5&color=fff&bold=true&size=64`}
                  alt="Profile"
                  className="w-8 h-8 rounded-lg shadow-sm"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-[13px] font-semibold text-slate-800 leading-none mb-0.5">
                    {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400">{user?.role || 'Free'}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 hidden lg:block transition-transform duration-200", headerMenuOpen && "rotate-180")} />
              </div>

              {headerMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/80 py-2 z-[100] animate-in slide-in-from-top-2 fade-in duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[13px] font-bold text-slate-900 truncate">
                      {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => { setActiveTab('profile'); setHeaderMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                    <User className="w-4 h-4 text-slate-400" /> My Profile
                  </button>
                  <button onClick={() => { setActiveTab('settings'); setHeaderMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </button>
                  <button onClick={() => { setActiveTab('pricing'); setHeaderMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                    <Crown className="w-4 h-4 text-slate-400" /> Plan & Billing
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={() => { handleLogout(); setHeaderMenuOpen(false); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

         {/* Scrollable Content */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 lg:pb-0">
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">

            {/* Page Header */}
            {activeTab !== 'profile' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="space-y-1 sm:space-y-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {activeTab === 'stats' ? 'Analytics' 
                      : activeTab === 'leads' ? 'Leads'
                      : activeTab === 'settings' ? 'Settings'
                      : getTabLabel()}
                  </h1>
                  <p className="text-[12px] sm:text-[14px] text-slate-500 font-medium">
                    {activeTab === 'stats' 
                      ? 'Track scan performance and visitor insights' 
                      : activeTab === 'leads'
                      ? 'Manage captured lead data'
                      : activeTab === 'pricing'
                      ? 'Choose the plan that fits your needs'
                      : activeTab === 'settings'
                      ? 'Customize your experience and preferences'
                      : `${displayedQRs.length} code${displayedQRs.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {!['stats', 'leads', 'pricing', 'settings'].includes(activeTab) && (
                  <button
                    onClick={() => navigate('/dashboard/create')}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[14px] sm:text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] shadow-sm shrink-0"
                  >
                    <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> <span>New QR Code</span>
                  </button>
                )}
              </div>
            )}

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

            ) : activeTab === 'profile' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                {/* ─── Profile Hero Card ─── */}
                <div className="relative bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                  {/* Gradient Banner integrated as Page Title */}
                  <div className="h-48 sm:h-56 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden flex flex-col justify-start pt-8 px-6 sm:px-10">
                    <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1.5px, transparent 1.5px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)', backgroundSize: '50px 50px, 35px 35px' }} />
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute top-6 left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                    
                    <div className="relative z-10 w-full mb-auto mt-2">
                      <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm mb-1.5">Profile</h1>
                      <p className="text-[15px] text-indigo-100 font-medium drop-shadow-sm max-w-sm">Manage your account and personal information</p>
                    </div>
                  </div>

                  <div className="px-6 sm:px-10 pb-8 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between relative z-20 gap-4 sm:gap-6">
                      {/* Avatar */}
                      <div className="relative shrink-0 -mt-16 sm:-mt-20 mx-auto sm:mx-0">
                        <div className="relative">
                          <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=4f46e5&color=fff&bold=true&size=160`}
                            alt="Profile"
                            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-[6px] border-white shadow-lg object-cover bg-white mx-auto sm:mx-0"
                          />
                          {isUploadingPhoto && (
                            <div className="absolute inset-0 bg-white/60 rounded-2xl flex items-center justify-center m-[6px]">
                              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="absolute -bottom-1.5 -right-1.5 w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-95 ring-[3px] ring-white cursor-pointer disabled:opacity-50"
                        >
                          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      {/* Info & Action Row */}
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 sm:mt-0 pb-1">
                        <div className="text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start gap-3 mb-1 flex-wrap">
                            <h2 className="text-[22px] sm:text-2xl font-bold text-slate-900 tracking-tight">
                              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                            </h2>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hidden sm:flex items-center">
                              {user?.role || 'USER'}
                            </span>
                          </div>
                          <p className="text-[14px] text-slate-500 font-medium truncate">{user?.email || 'guest@example.com'}</p>
                        </div>

                        <button 
                          onClick={() => {
                            console.log('Edit Profile button clicked (Profile Tab)');
                            setIsEditingProfile(true);
                          }} 
                          className="shrink-0 w-full sm:w-auto px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center sm:justify-start gap-2 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Account Details + Plan Info ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Account Details */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-slate-900">Account Details</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {[
                        { icon: Mail, label: 'Email Address', value: user?.email || '—' },
                        { icon: Shield, label: 'Account Role', value: user?.role === 'ADMIN' ? 'Administrator' : 'Member' },
                        { icon: Calendar, label: 'Member Since', value: 'April 2026' },
                        { icon: MapPin, label: 'Timezone', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
                        { icon: Globe, label: 'Language', value: 'English (US)' },
                      ].map(row => (
                        <div key={row.label} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <row.icon className="w-4 h-4 text-slate-400" />
                            <span className="text-[13px] font-medium text-slate-500">{row.label}</span>
                          </div>
                          <span className="text-[13px] font-semibold text-slate-900">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Crown className="w-4 h-4 text-amber-600" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-slate-900">Current Plan</h3>
                    </div>
                    <div className="p-6 space-y-5">
                      <div className="text-center py-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/20">
                          <Crown className="w-6 h-6 text-white fill-white" />
                        </div>
                        <p className="text-xl font-bold text-slate-900">{user?.plan?.name || 'Free'}</p>
                        <p className="text-[12px] font-medium text-slate-400 mt-1">
                          {user?.subscriptionStatus === 'active' ? 'Active Subscription'
                            : user?.subscriptionStatus === 'trialing' ? 'Trial Period'
                            : user?.subscriptionStatus === 'non-renewing' ? 'Ending Soon'
                            : 'No active subscription'}
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { label: 'QR Code Limit', value: user?.plan?.qrCodeLimit ? `${user.plan.qrCodeLimit} codes` : '∞ Unlimited' },
                          { label: 'Billing Cycle', value: user?.billingCycle ? user.billingCycle.charAt(0).toUpperCase() + user.billingCycle.slice(1) : 'N/A' },
                          { label: 'Status', value: user?.subscriptionStatus || 'Free', highlight: true },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-lg">
                            <span className="text-[12px] font-medium text-slate-500">{item.label}</span>
                            <span className={cn('text-[12px] font-semibold', 'highlight' in item && item.highlight ? 'text-emerald-600' : 'text-slate-900')}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setActiveTab('pricing')}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-[13px] transition-all active:scale-[0.97] shadow-lg shadow-blue-600/20"
                      >
                        {user?.subscriptionStatus === 'active' ? 'Manage Plan' : 'Upgrade Plan'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            ) : activeTab === 'settings' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 max-w-3xl">

                {/* ─── Account Settings ─── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900">Account</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Manage your personal information</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[
                      { label: 'Full Name', value: user ? `${user.firstName} ${user.lastName}` : 'Guest User', action: 'Edit' },
                      { label: 'Email Address', value: user?.email || '—', action: 'Change' },
                      { label: 'Password', value: '••••••••••••', action: 'Update' },
                    ].map(row => (
                      <div key={row.label} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                        <div>
                          <p className="text-[12px] font-medium text-slate-400 mb-0.5">{row.label}</p>
                          <p className="text-[14px] font-semibold text-slate-900">{row.value}</p>
                        </div>
                        <button 
                          onClick={() => {
                            console.log('Settings button clicked:', row.label);
                            if (row.action === 'Edit') {
                              setIsEditingProfile(true);
                            } else {
                              toast.error(`${row.action} is not implemented yet`);
                            }
                          }}
                          className="px-3.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-all active:scale-[0.97]"
                        >
                          {row.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── Notifications ─── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900">Notifications</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Control how you receive updates</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[
                      { label: 'Push Notification', desc: 'Get notified about account activity', value: pushNotifs, key: 'scanNotificationsEnabled' },
                      { label: 'Scan Alerts', desc: 'Real-time alerts when your QR codes are scanned', value: emailNotifs, key: 'emailNotificationsEnabled' },
                      { label: 'Weekly Digest', desc: 'Summary of your weekly QR performance', value: weeklyDigest, key: 'weeklyDigestEnabled' },
                    ].map(row => (
                      <div key={row.label} className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900 mb-0.5">{row.label}</p>
                          <p className="text-[12px] text-slate-400 font-medium">{row.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (row.label === 'Push Notification') {
                              handleTogglePush();
                            } else {
                              handleToggleSetting(row.key, !row.value);
                            }
                          }}
                          disabled={pushLoading || updateProfileMutation.isPending}
                          className={cn(
                            'w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-4',
                            row.value ? 'bg-blue-600' : 'bg-slate-200',
                            (pushLoading || updateProfileMutation.isPending) && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div className={cn(
                            'w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all duration-200',
                            row.value ? 'left-[22px]' : 'left-0.5'
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── Security ─── */}
                <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900">Security</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Protect your account</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900 mb-0.5">Two-Factor Authentication</p>
                          <p className="text-[12px] text-slate-400 font-medium">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSetting('twoFactorEnabled', !twoFactorEnabled)}
                        className={cn(
                          'w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ml-4',
                          twoFactorEnabled ? 'bg-emerald-600' : 'bg-slate-200'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all duration-200',
                          twoFactorEnabled ? 'left-[22px]' : 'left-0.5'
                        )} />
                      </button>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900 mb-0.5">Active Sessions</p>
                          <p className="text-[12px] text-slate-400 font-medium">1 active session on this device</p>
                        </div>
                      </div>
                      <button className="px-3.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all active:scale-[0.97]">
                        Manage
                      </button>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors opacity-60">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-[14px] font-semibold text-slate-900 mb-0.5">API Keys</p>
                          <p className="text-[12px] text-slate-400 font-medium">Advanced developer features are arriving soon.</p>
                        </div>
                      </div>
                      <button className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-lg border border-slate-200 uppercase tracking-widest cursor-not-allowed">
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── Danger Zone ─── */}
                <div className="bg-white rounded-2xl border border-red-200/80 overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-red-900">Danger Zone</h3>
                      <p className="text-[11px] text-red-400 font-medium">Irreversible and destructive actions</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-semibold text-slate-900 mb-0.5">Delete Account</p>
                        <p className="text-[12px] text-slate-400 font-medium">Permanently remove your account and all associated data</p>
                      </div>
                      <button className="px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-all active:scale-[0.97] shrink-0 ml-4">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {statsCards.map((stat) => {
                        const c = colorMap[stat.color];
                        return (
                          <div key={stat.label} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 p-3 sm:p-5 hover:shadow-md hover:border-slate-300/60 transition-all duration-200 group min-w-0">
                            <div className="flex items-center justify-between mb-2 sm:mb-4">
                              <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105', c.iconBg)}>
                                <stat.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', c.iconText)} />
                              </div>
                              <span className={cn('text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg', c.changeBg, c.changeText)}>
                                {stat.change}
                              </span>
                            </div>
                            <p className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-0.5 sm:mb-1">{stat.value}</p>
                            <p className="text-[10px] sm:text-[12px] font-medium text-slate-400 truncate">{stat.label}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5" ref={menuRef}>
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
                        <div className="px-3 sm:px-4 pt-4 sm:pt-5 pb-3">
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
                                <div className="absolute top-8 right-0 w-48 sm:w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-[100] animate-in slide-in-from-top-1 fade-in duration-150">
                                  <button onClick={() => { navigate(`/dashboard/edit/${qr.id}/content`); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                                    <Edit3 className="w-4 h-4 text-slate-400" /> Edit Content
                                  </button>
                                  <button onClick={() => { navigate(`/dashboard/edit/${qr.id}/design`); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                                    <Brush className="w-4 h-4 text-slate-400" /> Edit Design
                                  </button>
                                  <button onClick={() => { window.open(qr.shortUrl, '_blank'); setMenuOpen(null); }} className="w-full text-left px-4 py-2 text-[13px] font-medium hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                                    <ExternalLink className="w-4 h-4 text-slate-400" /> Preview Link
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
                                        <div className="absolute right-0 sm:left-full sm:right-auto top-full sm:top-0 mt-1 sm:mt-0 sm:ml-1 w-44 sm:w-48 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-[101]">
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
                          <div className="flex justify-center mb-3 sm:mb-4">
                            <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] bg-gradient-to-br from-slate-50 to-white rounded-xl sm:rounded-2xl flex items-center justify-center p-2 sm:p-3 border border-slate-100 group-hover:border-slate-200 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-slate-100/80 relative">
                              <DashboardQRPreview config={qr.config} shortUrl={qr.shortUrl} />
                            </div>
                          </div>

                          {/* Name + URL */}
                          <div className="text-center mb-3 min-w-0">
                            <h3 className="text-[13px] sm:text-[15px] font-bold text-slate-900 truncate leading-snug mb-1 px-1">{qr.name}</h3>
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-slate-400 min-w-0">
                              <Globe className="w-3 h-3 shrink-0" />
                              <p className="text-[10px] sm:text-[11px] font-medium truncate max-w-[140px] sm:max-w-[200px]">{qr.shortUrl.replace(/^https?:\/\//, '')}</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(qr.shortUrl); }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-all shrink-0"
                                title="Copy Link"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Mini Stats Row */}
                          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-1">
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

                        {/* ── Card Action Bar (Two Prominent Buttons) ── */}
                        <div className="flex items-center border-t border-slate-100 divide-x divide-slate-100 mt-auto bg-slate-50/10">
                          <button 
                            onClick={() => setViewingQR(qr)} 
                            className="flex-1 py-3.5 text-[12px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white flex items-center justify-center gap-2 transition-all duration-150"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          
                          <div className="relative flex-1">
                            <button 
                              onClick={() => setDownloadMenuOpen(downloadMenuOpen === qr.id ? null : qr.id)} 
                              className="w-full py-3.5 text-[12px] font-bold text-slate-600 hover:text-emerald-600 hover:bg-white flex items-center justify-center gap-2 transition-all duration-150"
                            >
                              <Download className="w-4 h-4" /> Export
                            </button>
                            {downloadMenuOpen === qr.id && (
                              <div className="absolute bottom-full left-0 right-0 mb-3 px-3 z-[100] animate-in slide-in-from-bottom-2 fade-in duration-150">
                                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 py-2 overflow-hidden">
                                  <div className="px-3 py-1.5 mb-1 border-b border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Format</p>
                                  </div>
                                  {(['png', 'svg', 'jpeg', 'webp'] as const).map(ext => (
                                    <button 
                                      key={ext}
                                      onClick={() => { handleDownload(qr, ext); setDownloadMenuOpen(null); }} 
                                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-slate-50 text-slate-700 uppercase flex items-center gap-3 transition-colors"
                                    >
                                      <div className="w-6 h-6 bg-slate-100 rounded-lg text-[10px] font-black flex items-center justify-center text-slate-500 border border-slate-200/50">.{ext}</div>
                                      {ext.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
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

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsEditingProfile(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10 relative">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">Update your personal information</p>
              </div>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                console.log('Profile update form submitted');
                const formData = new FormData(e.currentTarget);
                const firstName = formData.get('firstName') as string;
                const lastName = formData.get('lastName') as string;
                console.log('Form data:', { firstName, lastName });
                try {
                  await updateProfileMutation.mutateAsync({ firstName, lastName });
                  console.log('Profile update successful');
                  setIsEditingProfile(false);
                } catch (err) {
                  console.error('Profile update failed:', err);
                }
              }}
              className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-white"
            >
              
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-2">
                <div className="relative shrink-0">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=4f46e5&color=fff&bold=true&size=120`}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full border-2 border-slate-100 shadow-sm object-cover"
                  />
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[13px] font-medium transition-all shadow-sm disabled:opacity-50"
                    >
                      {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => updateProfileMutation.mutateAsync({ avatar: null })}
                      className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-lg text-[13px] font-medium transition-all"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Supported formats: JPG, PNG, GIF (Max. 5MB)</p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">First Name</label>
                  <input 
                    name="firstName"
                    defaultValue={user?.firstName || ''}
                    placeholder="Enter first name"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 rounded-xl py-2.5 px-4 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Last Name</label>
                  <input 
                    name="lastName"
                    defaultValue={user?.lastName || ''}
                    placeholder="Enter last name"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 rounded-xl py-2.5 px-4 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <hr className="border-slate-100/80" />

              {/* Read Only Fields */}
              <div className="space-y-5">
                <h4 className="text-[14px] font-bold text-slate-900">Account Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-700 flex items-center justify-between">
                      Email Address
                      <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 ml-2">Primary</span>
                    </label>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 flex items-center justify-between min-w-0">
                      <span className="text-[13px] font-medium text-slate-600 truncate mr-3">{user?.email || 'guest@example.com'}</span>
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-700">Role & Plan</label>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 flex items-center justify-between min-w-0">
                      <span className="text-[13px] font-medium text-slate-600 truncate capitalize mr-3">{user?.role || 'User'}</span>
                      <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </div>
                </div>
                <p className="text-[12px] text-slate-500 font-medium">To change your email address or update your billing plan, please contact our support team securely.</p>
              </div>

              {/* Modal Footer / Actions */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditingProfile(false)} 
                  className="px-5 py-2.5 bg-white text-slate-700 rounded-xl font-semibold text-[13px] hover:bg-slate-100 border border-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-[13px] transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View QR Code Modal */}
      {viewingQR && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 transition-all">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setViewingQR(null)} 
          />
          <div className="relative w-full max-w-sm bg-white rounded-[28px] sm:rounded-[40px] shadow-2xl border border-slate-200/60 overflow-hidden animate-in zoom-in-95 fade-in duration-300 p-5 sm:p-8 flex flex-col items-center gap-4 sm:gap-6">
            <div className="w-full flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900 truncate">{viewingQR.name}</h3>
                <p className="text-[12px] font-medium text-slate-400 mt-0.5 truncate">{viewingQR.shortUrl.replace(/^https?:\/\//, '')}</p>
              </div>
              <button 
                onClick={() => setViewingQR(null)} 
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full aspect-square bg-white rounded-[20px] sm:rounded-[32px] p-6 sm:p-10 shadow-inner border border-slate-100 flex items-center justify-center group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px]" />
              <div className="relative z-10 w-full h-full">
                <DashboardQRPreview config={viewingQR.config} shortUrl={viewingQR.shortUrl} size={400} />
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleDownload(viewingQR, 'png')}
                className="py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-[13px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              <button 
                onClick={() => copyToClipboard(viewingQR.shortUrl)}
                className="py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl font-bold text-[13px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-100"
              >
                <Copy className="w-4 h-4" /> Copy Link
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 font-medium text-center px-4">
              Use this high-resolution QR code for digital displays or quick scanning.
            </p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 sm:px-6 flex items-center justify-between z-[100] safe-area-inset-bottom">
          <button 
            onClick={() => setActiveTab('all')}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300",
              activeTab === 'all' ? "text-blue-600 scale-110" : "text-slate-400"
            )}
          >
             <div className={cn("p-1 rounded-xl transition-all", activeTab === 'all' ? "bg-blue-50" : "bg-transparent")}>
                <LayoutGrid className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300",
              activeTab === 'stats' ? "text-blue-600 scale-110" : "text-slate-400"
            )}
          >
             <div className={cn("p-1 rounded-xl transition-all", activeTab === 'stats' ? "bg-blue-50" : "bg-transparent")}>
                <BarChart3 className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-tight">Stats</span>
          </button>

          {/* Floating Create Button */}
          <button 
            onClick={() => navigate('/dashboard/create')}
            className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center -mt-12 border-[4px] border-slate-50 active:scale-90 transition-all"
          >
             <Plus className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setActiveTab('leads')}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300",
              activeTab === 'leads' ? "text-blue-600 scale-110" : "text-slate-400"
            )}
          >
             <div className={cn("p-1 rounded-xl transition-all", activeTab === 'leads' ? "bg-blue-50" : "bg-transparent")}>
                <Users className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-tight">Leads</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300",
              activeTab === 'settings' ? "text-blue-600 scale-110" : "text-slate-400"
            )}
          >
             <div className={cn("p-1 rounded-xl transition-all", activeTab === 'settings' ? "bg-blue-50" : "bg-transparent")}>
                <Settings className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-tight">Setup</span>
          </button>
      </div>
    </div>
  );
};

export default DashboardPage;
