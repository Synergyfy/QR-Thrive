import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, QrCode, Archive, BarChart3, User, Settings, Crown,
  Search, Plus, MoreVertical, Calendar, ExternalLink, Edit2, Brush, Globe,
  ChevronDown, ChevronRight, Bell, FolderOpen, Trash2, Copy, Printer,
  RefreshCw, X, FolderPlus, ArrowRight, Edit3, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import { useFolders, useCreateFolder, useDeleteFolder, useQRCodes, useDeleteQRCode, useUpdateQRCode, useDuplicateQRCode, useCurrentUser, useLogout } from '../hooks/useApi';
import type { BackendQRCode } from '../types/api';
import StatsPanel from '../components/StatsPanel';
import DashboardQRPreview from '../components/DashboardQRPreview';
import QRCodeStyling from 'qr-code-styling';
import { LogOut } from 'lucide-react';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: userData } = useCurrentUser();
  const logoutMutation = useLogout();
  const user = userData?.user;
  
  const { data: folders = [] } = useFolders();
  const { data: qrCodes = [] } = useQRCodes();
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

  const renameQR = async (id: string, name: string) => {
    try {
      await updateQRMutation.mutateAsync({ id, data: { name }});
      toast.success('Renamed successfully');
    } catch (e) {
      toast.error('Failed to rename');
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

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingQR, setRenamingQR] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [editingURLQR, setEditingURLQR] = useState<string | null>(null);
  const [newURLValue, setNewURLValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
        setFolderMenuOpen(null);
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

  const handleRename = (id: string) => {
    if (renameValue.trim()) {
      renameQR(id, renameValue.trim());
      setRenamingQR(null);
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

  const handleDownload = async (qr: BackendQRCode) => {
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

    // 2. If no frame, just download directly
    if (qr.config.frame.type === 'none') {
      qrCode.download({ name: qr.name, extension: 'png' });
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
      const link = document.createElement('a');
      link.download = `${qr.name}.png`;
      link.href = canvas.toDataURL('image/png');
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
    if (activeTab.startsWith('folder:')) {
      const f = folders.find(fld => fld.id === activeTab.replace('folder:', ''));
      return f ? f.name : 'Folder';
    }
    return 'QR Codes';
  };

  const getColorFromType = (type: string) => {
    const map: Record<string, string> = {
      URL: 'blue', Socials: 'purple', Event: 'amber', PDF: 'red',
      Video: 'pink', MP3: 'indigo', App: 'cyan', Image: 'emerald',
      vCard: 'teal', WiFi: 'orange', Email: 'sky', SMS: 'violet',
    };
    return map[type] || 'blue';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => navigate('/')}>
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
               <QrCode className="w-6 h-6" />
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tight">QR Thrive</span>
          </div>

          <button 
            onClick={() => navigate('/dashboard/create')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 mb-10"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Create QR Code
          </button>

          <nav className="space-y-1.5">
            {[
              { id: 'all', icon: QrCode, label: 'QR Codes', count: qrCodes.length },
              { id: 'active', icon: LayoutGrid, label: 'Active', count: activeQRs.length },
              { id: 'archived', icon: Archive, label: 'Archived', count: archivedQRs.length },
              { id: 'stats', icon: BarChart3, label: 'Stats' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                  activeTab === item.id 
                    ? "bg-slate-50 text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                </div>
                {item.count !== undefined && (
                   <span className={cn(
                     "text-[10px] font-black px-2 py-0.5 rounded-full",
                     activeTab === item.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                   )}>{item.count}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Folders */}
          <div className="mt-10 pt-10 border-t border-slate-50">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Folders</p>
             <div className="space-y-1">
                {folders.map(folder => (
                   <div key={folder.id} className="group flex items-center">
                     <button 
                       onClick={() => setActiveTab(`folder:${folder.id}`)}
                       className={cn(
                         "flex-1 flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all",
                         activeTab === `folder:${folder.id}` ? "bg-slate-50 text-blue-600" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                       )}
                     >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: folder.color}} />
                        <span className="truncate">{folder.name}</span>
                        <span className="text-[10px] font-black text-slate-300 ml-auto">
                          {getQRsByFolder(folder.id).length}
                        </span>
                     </button>
                     <button 
                       onClick={() => deleteFolder(folder.id)}
                       className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all mr-2"
                     >
                       <X className="w-3 h-3" />
                     </button>
                   </div>
                ))}

                {showNewFolder ? (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <input 
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                      placeholder="Folder name..."
                      className="flex-1 text-sm font-bold outline-none bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-600"
                    />
                    <button onClick={handleCreateFolder} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="p-2 text-slate-400 hover:text-slate-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowNewFolder(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-blue-600 text-sm font-bold hover:bg-blue-50 rounded-xl transition-all"
                  >
                     <FolderPlus className="w-4 h-4" /> New Folder
                  </button>
                )}
             </div>
          </div>
        </div>

        <div className="mt-auto p-6 space-y-3">
           <button className="w-full p-4 bg-slate-900 rounded-2xl flex items-center justify-between group overflow-hidden relative">
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Professional Plan</p>
                 <p className="text-sm font-bold text-white">Upgrade Now</p>
              </div>
              <Crown className="w-8 h-8 text-white/10 group-hover:text-blue-500 transition-colors transform rotate-12" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/0 via-blue-600/0 to-blue-600/20 group-hover:to-blue-600/40 transition-all" />
           </button>
           <div className="flex items-center gap-3 p-3 text-slate-500 hover:text-slate-900 cursor-pointer transition-all hover:bg-slate-50 rounded-xl">
              <User className="w-5 h-5" /><span className="text-sm font-bold">Account</span>
           </div>
           <div className="flex items-center gap-3 p-3 text-slate-500 hover:text-slate-900 cursor-pointer transition-all hover:bg-slate-50 rounded-xl">
              <Settings className="w-5 h-5" /><span className="text-sm font-bold">Settings</span>
           </div>
           <div 
             onClick={handleLogout}
             className="flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 cursor-pointer transition-all rounded-xl"
           >
              <LogOut className="w-5 h-5" /><span className="text-sm font-bold">Log Out</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 relative z-20">
           <div className="flex items-center gap-4 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 w-full max-md focus-within:ring-2 ring-blue-100 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" placeholder="Search QR Codes..." 
                className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full placeholder:text-slate-400"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-8">
              <div className="relative cursor-pointer">
                 <Bell className="w-6 h-6 text-slate-400 hover:text-slate-900 transition-colors" />
                 <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
              </div>
              <div className="h-10 w-px bg-slate-100" />
               <div className="flex items-center gap-4 group cursor-pointer">
                 <div className="text-right flex flex-col items-end">
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">
                      {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-transparent group-hover:border-blue-600 transition-all p-0.5">
                    <img src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=2563eb&color=fff`} alt="Profile" className="w-full h-full rounded-[14px]" />
                 </div>
                 <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-all" />
              </div>
           </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
           {/* Promo Banner */}
           {activeTab !== 'archived' && activeTab !== 'stats' && (
             <div className="bg-slate-900 rounded-[32px] p-8 relative overflow-hidden group">
                <div className="relative z-10 flex items-center justify-between">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                         <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Unlimited Possibilities</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">Unlock Full Customization & Real-time Stats</h2>
                      <p className="text-slate-400 font-medium max-w-xl">Upgrade to a Professional Plan today and get unlimited Dynamic QRs, advanced analytics, and custom domains.</p>
                   </div>
                   <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 active:scale-95 transition-all shadow-xl">
                      View Pricing
                   </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
             </div>
           )}

           {/* List Controls */}
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {activeTab === 'stats' ? 'Analytics Insights' : getTabLabel()}
                 </h1>
                 <div className="px-3 py-1 bg-slate-100 text-slate-400 text-xs font-black rounded-lg">
                    {activeTab === 'stats' ? 'LIVE' : `${displayedQRs.length} TOTAL`}
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <button className="flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-100 rounded-2xl font-bold text-slate-600 hover:border-blue-600 transition-all shadow-sm">
                    <Calendar className="w-4 h-4" /> {activeTab === 'stats' ? 'Last 30 Days' : 'Last Created'} <ChevronDown className="w-4 h-4 ml-2" />
                 </button>
              </div>
           </div>

           {activeTab === 'stats' ? (
             <StatsPanel codes={qrCodes} />
           ) : (
             <>
               {/* Empty State */}
               {displayedQRs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center mb-8">
                      <QrCode className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      {activeTab === 'archived' ? 'No archived QR codes' : 'No QR codes yet'}
                    </h3>
                    <p className="text-slate-400 font-medium mb-8 max-w-sm">
                      {activeTab === 'archived' 
                        ? 'QR codes you archive will appear here.' 
                        : 'Create your first QR code to get started with your digital marketing journey.'}
                    </p>
                    {activeTab !== 'archived' && (
                      <button 
                        onClick={() => navigate('/dashboard/create')}
                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        <Plus className="w-5 h-5" /> Create Your First QR Code
                      </button>
                    )}
                  </div>
               )}

               {/* QR Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 pb-10" ref={menuRef}>
                  {displayedQRs.map((qr) => {
                    const color = getColorFromType(qr.type);
                    return (
                     <div key={qr.id} className="bg-white rounded-[40px] border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col relative z-10 hover:z-20">
                        <div className="p-8 pb-0 flex items-start justify-between relative">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-${color}-100 text-${color}-600`}>
                                 <ChevronRight className="w-5 h-5 rotate-[-45deg]" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{qr.type}</p>
                                 {renamingQR === qr.id ? (
                                   <input
                                     autoFocus
                                     value={renameValue}
                                     onChange={(e) => setRenameValue(e.target.value)}
                                     onKeyDown={(e) => { if (e.key === 'Enter') handleRename(qr.id); if (e.key === 'Escape') setRenamingQR(null); }}
                                     onBlur={() => handleRename(qr.id)}
                                     className="text-xl font-bold text-slate-900 outline-none border-b-2 border-blue-600 bg-transparent w-full"
                                   />
                                 ) : (
                                   <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors cursor-pointer"
                                       onClick={() => { setRenamingQR(qr.id); setRenameValue(qr.name); }}>
                                      {qr.name}
                                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                   </h3>
                                 )}
                              </div>
                           </div>
                           {/* Three-Dot Menu */}
                           <div className="relative">
                             <button 
                               onClick={() => setMenuOpen(menuOpen === qr.id ? null : qr.id)}
                               className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                             >
                               <MoreVertical className="w-5 h-5" />
                             </button>
                             {menuOpen === qr.id && (
                               <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                  <button onClick={() => { navigate(`/dashboard/edit/${qr.id}/content`); setMenuOpen(null); }}
                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                                    <RefreshCw className="w-4 h-4" /> Change QR Code Type
                                  </button>
                                  {/* Move to Folder submenu */}
                                  <div className="relative">
                                    <button onClick={() => setFolderMenuOpen(folderMenuOpen === qr.id ? null : qr.id)}
                                      className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                                      <FolderOpen className="w-4 h-4" /> Move to folder <ArrowRight className="w-3 h-3 ml-auto text-slate-300" />
                                    </button>
                                    {folderMenuOpen === qr.id && (
                                      <div className="absolute right-full top-0 mr-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[60] animate-in slide-in-from-right-4 duration-300">
                                        <button onClick={() => { moveToFolder(qr.id, undefined); setFolderMenuOpen(null); setMenuOpen(null); }}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600">
                                          <X className="w-3.5 h-3.5" /> No Folder
                                        </button>
                                        {folders.map(f => (
                                          <button key={f.id} onClick={() => { moveToFolder(qr.id, f.id); setFolderMenuOpen(null); setMenuOpen(null); }}
                                            className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition-all",
                                              qr.folderId === f.id ? "text-blue-600 bg-blue-50/50" : "text-slate-600 hover:text-blue-600")}>
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor: f.color}} />
                                            {f.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <button onClick={() => { duplicateQR(qr.id); setMenuOpen(null); }}
                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                                    <Copy className="w-4 h-4" /> Duplicate
                              </button>
                              <button onClick={() => { window.print(); setMenuOpen(null); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                                <Printer className="w-4 h-4" /> Print QR Code
                              </button>
                              <div className="my-2 border-t border-slate-100" />
                              <button onClick={() => { qr.status === 'archived' ? unarchiveQR(qr.id) : archiveQR(qr.id); setMenuOpen(null); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all">
                                <Archive className="w-4 h-4" /> {qr.status === 'archived' ? 'Unarchive' : 'Archive'}
                              </button>
                              <button onClick={() => { deleteQR(qr.id); setMenuOpen(null); }}
                                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                               </div>
                             )}
                           </div>
                        </div>

                        <div className="p-8 flex-1">
                           <div className="flex gap-4 items-center bg-slate-50/50 p-6 rounded-[32px] border border-slate-50 relative overflow-hidden">
                              <div className="w-28 h-28 bg-white rounded-2xl shadow-inner border border-slate-100 shrink-0 relative overflow-hidden group/qr flex items-center justify-center p-2">
                                 <DashboardQRPreview config={qr.config} shortUrl={qr.shortUrl} />
                                 <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="text-white w-8 h-8" />
                                 </div>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-1">
                                 <div className="space-y-2.5">
                                    <div className="space-y-0.5">
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Last Updated</p>
                                       <p className="text-[12px] font-bold text-slate-600 truncate">{formatDate(qr.updatedAt)}</p>
                                    </div>
                                    <a 
                                      href={qr.shortUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-blue-600 truncate hover:underline group/link"
                                    >
                                       <QrCode className="w-3.5 h-3.5 shrink-0 group-hover/link:animate-pulse" />
                                       <span className="text-[12px] font-black tracking-tight truncate">
                                          {typeof qr.shortUrl === 'string' ? qr.shortUrl.replace(/^https?:\/\//, '') : ''}
                                       </span>
                                    </a>
                                    {qr.config.data.type === 'url' && qr.config.data.url && (
                                      <div className="flex items-center gap-2 group/edit-container">
                                        <a 
                                          href={qr.config.data.url.startsWith('http') ? qr.config.data.url : `https://${qr.config.data.url}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors group/dest"
                                        >
                                           <Globe className="w-3 h-3 shrink-0" />
                                           <span className="text-[9px] font-bold truncate underline-offset-2 hover:underline">{qr.config.data.url}</span>
                                        </a>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingURLQR(qr.id);
                                            setNewURLValue(qr.config.data.url || '');
                                          }}
                                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-slate-100"
                                          title="Quick Edit URL"
                                        >
                                          <Edit3 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    )}
                                 </div>
                                 
                                 <div className="flex items-center gap-3 pt-3 mt-auto border-t border-slate-100/50">
                                    <button 
                                      onClick={() => navigate(`/dashboard/edit/${qr.id}/content`)}
                                      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors shrink-0"
                                    >
                                       <Edit2 className="w-2.5 h-2.5" /> Edit
                                    </button>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                                    <button 
                                      onClick={() => navigate(`/dashboard/edit/${qr.id}/design`)}
                                      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors shrink-0"
                                    >
                                       <Brush className="w-2.5 h-2.5" /> Design
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="px-8 pb-8 flex flex-col gap-4">
                           <div className="flex gap-4">
                              <button className="flex-1 px-5 py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold text-slate-600">
                                 <BarChart3 className="w-4 h-4" />
                                 <span className="text-blue-600">{qr.scans}</span> Scans
                              </button>
                              
                              {qr.type === 'form' && (
                                <button className="flex-1 px-5 py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all font-bold text-slate-600">
                                   <ClipboardList className="w-4 h-4" />
                                   <span className="text-emerald-600">{qr.form?._count?.submissions || 0}</span> Responses
                                </button>
                              )}
                           </div>

                           <button 
                             onClick={() => handleDownload(qr)}
                             className="w-full px-5 py-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all"
                           >
                              <ChevronDown className="w-4 h-4 stroke-[3]" /> Download QR Code
                           </button>
                        </div>

                        {/* Status badge */}
                        {qr.status === 'archived' && (
                          <div className="absolute top-4 right-20 px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full">
                            Archived
                          </div>
                        )}
                     </div>
                    );
                  })}
               </div>
             </>
           )}
        </div>
      </main>

      {/* Quick URL Edit Modal */}
      {editingURLQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingURLQR(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-none">Update URL</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Quickly change the destination</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingURLQR(null)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination URL</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={newURLValue}
                      onChange={(e) => setNewURLValue(e.target.value)}
                      placeholder="https://example.com"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleURLUpdate()}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditingURLQR(null)}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleURLUpdate}
                    disabled={!newURLValue.trim()}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Save Changes <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
