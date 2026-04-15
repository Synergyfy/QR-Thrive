import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Globe,
  FileText,
  Image as ImageIcon,
  Video,
  User,
  SmartphoneNfc,
  Music,
  Building2,
  UtensilsCrossed,
  Phone,
  Link2,
  Users,
  Ticket,
  Wifi,
  Zap,
  Palette,
  Image as LogoIcon,
  Frame,
  Loader2,
  LayoutGrid,
  FileEdit,
  X,
  Lock
} from 'lucide-react';

const FacebookIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
import { useNavigate, useParams } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { QRConfiguration } from '../types/qr';
import DesignPanel from '../components/panels/DesignPanel';
import LogoPanel from '../components/panels/LogoPanel';
import FramePanel from '../components/panels/FramePanel';
import ContentPanel from '../components/panels/ContentPanel';
import QRCodePreview from '../components/QRCodePreview';
import DynamicView from '../components/DynamicView';
import toast from 'react-hot-toast';
import { useQRCode, useCreateQRCode, useUpdateQRCode, useCurrentUser } from '../hooks/useApi';
import { uploadAllPendingFiles } from '../utils/upload';
import { uploadApi } from '../services/api';
import { getDashboardPath } from '../utils/auth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Step = 'type' | 'content' | 'design';

const HELP_CONTENT: Record<Step, { title: string; description: string; icon: any; color: string; image: string }> = {
  type: {
    title: "Select a QR code type",
    description: "Select the type of QR code you need by clicking on the respective icon. You have up to 16 different options.",
    icon: LayoutGrid,
    color: "bg-blue-600",
    image: "/inspo-2.png"
  },
  content: {
    title: "Add content",
    description: "Fill in the necessary information for your QR code. Depending on the type selected, you can add links, files, or text.",
    icon: FileEdit,
    color: "bg-purple-600",
    image: "/inspo-2.png" // Using the same inspo-2 image as requested
  },
  design: {
    title: "Design your QR code",
    description: "Customize the appearance of your QR code. Change colors, add a frame, or upload your logo to make it unique.",
    icon: Palette,
    color: "bg-pink-600",
    image: "/inspo-2.png"
  }
};

interface QRTypeOption {
  id: string;
  icon: any;
  title: string;
  description: string;
  category: 'dynamic' | 'static';
}

const qrTypes: QRTypeOption[] = [
  { id: 'url', icon: Globe, title: 'Website', description: 'Link to any website URL', category: 'static' },
  { id: 'pdf', icon: FileText, title: 'PDF', description: 'Show a PDF', category: 'dynamic' },
  { id: 'links', icon: Link2, title: 'List of Links', description: 'Share multiple links', category: 'dynamic' },
  { id: 'vcard', icon: User, title: 'vCard', description: 'Share a digital business card', category: 'dynamic' },
  { id: 'business', icon: Building2, title: 'Business', description: 'Share information about your business', category: 'dynamic' },
  { id: 'video', icon: Video, title: 'Video', description: 'Show a video', category: 'dynamic' },
  { id: 'image', icon: ImageIcon, title: 'Images', description: 'Share multiple images', category: 'dynamic' },
  { id: 'facebook', icon: FacebookIcon, title: 'Facebook', description: 'Share your Facebook page', category: 'dynamic' },
  { id: 'instagram', icon: InstagramIcon, title: 'Instagram', description: 'Share your Instagram', category: 'dynamic' },
  { id: 'socials', icon: Users, title: 'Social Media', description: 'Share your social channels', category: 'dynamic' },
  { id: 'whatsapp', icon: Phone, title: 'WhatsApp', description: 'Get WhatsApp messages', category: 'dynamic' },
  { id: 'mp3', icon: Music, title: 'MP3', description: 'Share an audio file', category: 'dynamic' },
  { id: 'menu', icon: UtensilsCrossed, title: 'Menu', description: 'Create a restaurant menu', category: 'dynamic' },
  { id: 'app', icon: SmartphoneNfc, title: 'Apps', description: 'Redirect to an app store', category: 'dynamic' },
  { id: 'coupon', icon: Ticket, title: 'Coupon', description: 'Share a coupon', category: 'dynamic' },
  { id: 'wifi', icon: Wifi, title: 'WiFi', description: 'Connect to a Wi-Fi network', category: 'static' },
];

const INITIAL_CONFIG: QRConfiguration = {
  data: { type: 'url', url: 'https://qr-thrive.com' },
  design: {
    dots: { type: 'square', color: '#000000' },
    cornersSquare: { type: 'square', color: '#000000' },
    cornersDot: { type: 'dot', color: '#000000' },
    background: { color: '#ffffff' },
    imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
    qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'Q' },
  },
  frame: { type: 'none', text: 'SCAN ME', color: '#000000', textColor: '#ffffff' },
  width: 400, height: 400, margin: 20,
  isDynamic: false, shortId: 'wizard-preview',
};

const CreationWizard: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId, step: editStep } = useParams<{ id?: string; step?: string }>();
  const { data: existingQR } = useQRCode(editId || '');
  const createQRMutation = useCreateQRCode();
  const updateQRMutation = useUpdateQRCode();

  const isEditing = !!editId;

  const [step, setStep] = useState<Step>(() => {
    if (editStep === 'content') return 'content';
    if (editStep === 'design') return 'design';
    return 'type';
  });
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [config, setConfig] = useState<QRConfiguration>(INITIAL_CONFIG);
  const [designTab, setDesignTab] = useState<'shape' | 'frame' | 'logo' | 'colors'>('shape');
  const [previewMode, setPreviewMode] = useState<'preview' | 'qr'>('preview');

  // Load existing QR when editing
  useEffect(() => {
    if (editId) {
      if (existingQR) {
        setConfig(existingQR.config);
        setSelectedType(existingQR.config.data.type);
      }
    }
  }, [editId, existingQR]);

  const { data: userData } = useCurrentUser();
  const user = userData?.user;

  const isLocked = (typeId: string) => {
    if (user?.role === 'ADMIN') return false;
    const allowedTypes = user?.plan?.qrCodeTypes || [];
    return !allowedTypes.includes(typeId as any);
  };

  // Sync types for new QRs
  useEffect(() => {
    if (selectedType && !isEditing) {
      setConfig(prev => {
        const newData = { ...prev.data, type: selectedType as any } as any;
        
        // Auto-populate whatsappNumber for menu if user has a phone
        if (selectedType === 'menu' && (user as any)?.phone) {
          newData.menu = {
            ...(newData.menu || {}),
            whatsappNumber: (user as any).phone
          };
        }
        
        return {
          ...prev,
          data: newData,
          isDynamic: true // All QR codes should be dynamic by default
        };
      });
    }
  }, [selectedType, isEditing, user]);

  const steps = [
    { id: 'type', label: 'Choose Type' },
    { id: 'content', label: 'Additional Information' },
    { id: 'design', label: 'QR Design' },
  ];

  const updateConfig = (updates: Partial<QRConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };
  const updateData = (updates: any) => {
    setConfig(prev => ({ ...prev, data: { ...prev.data, ...updates } }));
  };
  const updateDesign = (updates: any) => {
    setConfig(prev => ({ ...prev, design: { ...prev.design, ...updates } }));
  };

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedPublicIds, setUploadedPublicIds] = useState<string[]>([]);

  const cleanupUploadedFiles = async () => {
    for (const publicId of uploadedPublicIds) {
      try {
        await uploadApi.deleteFile(publicId);
      } catch (err) {
        console.error('Failed to delete file:', publicId);
      }
    }
    setUploadedPublicIds([]);
  };

  const handleFinish = async () => {
    setUploadingFiles(true);
    try {
      const uploadedData = await uploadAllPendingFiles(config.data);
      
      const dataToSave = {
        ...config.data,
        ...uploadedData,
      };

      const publicIds: string[] = [];
      const collectPublicIds = (data: any) => {
        if (data?.publicId) {
          publicIds.push(data.publicId);
        }
      };
      collectPublicIds(dataToSave.image);
      collectPublicIds(dataToSave.video);
      collectPublicIds(dataToSave.pdf);
      collectPublicIds(dataToSave.mp3);
      setUploadedPublicIds(publicIds);

      if (isEditing && editId) {
        await updateQRMutation.mutateAsync({ 
          id: editId, 
          data: { 
            name: `${config.data.type} QR`, 
            type: config.data.type, 
            data: dataToSave, 
            design: config.design, 
            frame: config.frame, 
            logo: config.logo, 
            width: config.width, 
            height: config.height, 
            margin: config.margin,
            linkedQRCodeId: dataToSave.connectedQrId || dataToSave.linkedQRCodeId || config.linkedQRCodeId
          } 
        });
        toast.success('QR Code updated successfully!');
      } else {
        await createQRMutation.mutateAsync({ 
          name: `${config.data.type} QR`, 
          type: config.data.type, 
          data: dataToSave, 
          design: config.design, 
          frame: config.frame, 
          logo: config.logo, 
          width: config.width, 
          height: config.height, 
          margin: config.margin,
          linkedQRCodeId: dataToSave.connectedQrId || dataToSave.linkedQRCodeId || config.linkedQRCodeId
        });
        toast.success('QR Code created successfully!');
      }
      navigate(getDashboardPath(user?.role));
    } catch (error: any) {
      await cleanupUploadedFiles();
      toast.error(error?.response?.data?.message || 'Failed to save QR Code');
    } finally {
      setUploadingFiles(false);
    }
  };

  const isSaving = createQRMutation.isPending || updateQRMutation.isPending || uploadingFiles;

  const handleBack = () => {
    if (isEditing) {
      // In edit mode, back always goes to dashboard
      navigate(getDashboardPath(user?.role));
    } else if (step === 'type') {
      navigate(getDashboardPath(user?.role));
    } else {
      setStep(steps[steps.findIndex(s => s.id === step) - 1].id as Step);
    }
  };

  const handleNext = () => {
    if (step === 'design') {
      handleFinish();
    } else {
      setStep(steps[steps.findIndex(s => s.id === step) + 1].id as Step);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <nav className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center cursor-pointer shrink-0" onClick={() => navigate(getDashboardPath(user?.role))}>
            <img src="/QRThrive_Logo_Full-BG.png" alt="QR Thrive" className="h-14 w-auto" style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(95%) saturate(3033%) hue-rotate(211deg) brightness(96%) contrast(92%)' }} />
        </div>

        {/* Stepper (Centered) */}
        <div className="hidden md:flex items-center gap-4">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2">
                   <div className={cn(
                     "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                     step === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                     steps.findIndex(x => x.id === step) > idx ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                   )}>
                      {idx + 1}
                   </div>
                   <span className={cn(
                     "text-xs font-bold tracking-tight whitespace-nowrap",
                     step === s.id ? "text-slate-900" : "text-slate-400"
                   )}>{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                )}
              </React.Fragment>
            ))}
        </div>

        <div className="flex items-center gap-4 shrink-0">
           <div className="hidden sm:flex items-center gap-2 mr-4">
              <button 
                onClick={() => setIsHelpOpen(true)}
                className="p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 hover:text-blue-600 transition-colors"
              >
                 <div className="w-5 h-5 border-2 border-current rounded-md flex items-center justify-center text-[10px] font-bold">?</div>
              </button>
           </div>
           <button 
            onClick={handleBack}
            className="px-5 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
           >
              Back
           </button>
           <button 
            disabled={!selectedType || isSaving}
            onClick={handleNext}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg min-w-[100px] justify-center tracking-widest uppercase",
              selectedType ? "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            )}
           >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  {step === 'design' ? (isEditing ? 'Save' : 'Finish') : 'Next'}
                </>
              )}
           </button>
        </div>
      </nav>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden relative">
         {/* Left Side: Configuration */}
         <div className="flex-1 overflow-y-auto p-12 custom-scrollbar flex flex-col items-center relative z-20 pr-[480px]">
            <div className="w-full max-w-4xl space-y-10">
               {step === 'type' && (
                 <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                       <h1 className="text-3xl font-bold text-slate-900 tracking-tight">1. Select a type of QR code</h1>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       {qrTypes.map(type => (
                          <button
                            key={type.id}
                            onMouseEnter={() => setHoveredType(type.id)}
                            onMouseLeave={() => setHoveredType(null)}
                            onClick={() => !isLocked(type.id) && setSelectedType(type.id)}
                            className={cn(
                              "flex flex-col items-center text-center p-6 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                              isLocked(type.id)
                                ? "border-slate-100 bg-slate-50/30 opacity-80 cursor-not-allowed"
                                : selectedType === type.id
                                  ? "border-blue-600 bg-blue-50/10 ring-4 ring-blue-50/30 hover:scale-[1.02] active:scale-[0.98]"
                                  : "border-white bg-white hover:border-slate-100 shadow-sm shadow-slate-200/50 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                          >
                             {/* Padlock for restricted types */}
                             {isLocked(type.id) && (
                               <div className="absolute top-4 right-4 text-slate-300">
                                 <Lock className="w-4 h-4" />
                               </div>
                             )}

                             <div className={cn(
                               "w-16 h-16 rounded-full flex items-center justify-center transition-all mb-4 border-2",
                               isLocked(type.id)
                                 ? "bg-slate-100 text-slate-300 border-slate-200"
                                 : selectedType === type.id
                                   ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                                   : "bg-white text-slate-400 border-slate-100 group-hover:border-blue-100 group-hover:text-blue-600"
                             )}>
                                <type.icon className="w-7 h-7" />
                             </div>
                             <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm tracking-tight">{type.title}</h3>
                                <p className="text-xs font-medium text-slate-400 leading-tight px-2">
                                  {isLocked(type.id) ? 'Upgrade to unlock' : type.description}
                                </p>
                             </div>
                             {type.category === 'dynamic' && !isLocked(type.id) && (
                                <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                             )}
                          </button>
                       ))}
                    </div>
                 </div>
               )}

               {step === 'content' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                              2. {isEditing ? 'Edit Content' : qrTypes.find(t => t.id === selectedType)?.title}
                           </h1>
                           <p className="text-slate-400 font-medium">
                              {isEditing ? 'Update the information for your QR Code.' : 'Complete the information for your QR Code.'}
                           </p>
                        </div>
                        {!isEditing && (
                          <button className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-blue-100">
                             <Zap className="w-3.5 h-3.5 fill-white" /> Bulk Creation
                          </button>
                        )}
                     </div>
                     <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <ContentPanel config={config} updateData={updateData} hideTypeSelector={true} />
                     </div>
                  </div>
               )}

               {step === 'design' && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                       <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                          3. {isEditing ? 'Edit Design' : 'Design QR Code'}
                       </h1>
                       <p className="text-slate-400 font-medium">Customize the look of your QR code to match your brand.</p>
                    </div>
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                       <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
                          {(['shape', 'frame', 'logo'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setDesignTab(tab)}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all",
                                designTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                              )}>
                               {tab === 'shape' && <Palette className="w-4 h-4" />}
                               {tab === 'frame' && <Frame className="w-4 h-4" />}
                               {tab === 'logo' && <LogoIcon className="w-4 h-4" />}
                               {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                          ))}
                       </div>
                       <div className="p-8">
                          {designTab === 'shape' && <DesignPanel design={config.design} updateDesign={updateDesign} />}
                          {designTab === 'frame' && <FramePanel config={config} updateConfig={updateConfig} />}
                          {designTab === 'logo' && <LogoPanel config={config} updateConfig={updateConfig} />}
                       </div>
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* Right Side: Preview (Fixed) */}
         <div className="fixed top-20 right-0 bottom-0 w-[480px] bg-white border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-30 p-12 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
            <div className="w-full flex flex-col items-center">
               {selectedType && (
                  <div className="mb-10 w-full max-w-[240px] p-1.5 bg-blue-50/50 rounded-full border border-blue-100 flex items-center relative group/switcher shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className={cn(
                       "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-blue-600 rounded-full shadow-lg shadow-blue-200 transition-all duration-300 ease-out z-10",
                       previewMode === 'qr' ? "left-[calc(50%+3px)]" : "left-1.5"
                     )} />
                     <button 
                       onClick={() => setPreviewMode('preview')}
                       className={cn(
                         "flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-20 transition-colors duration-300",
                         previewMode === 'preview' ? "text-white" : "text-blue-400 hover:text-blue-600"
                       )}
                     >
                        Preview
                     </button>
                     <button 
                       onClick={() => setPreviewMode('qr')}
                       className={cn(
                         "flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-20 transition-colors duration-300",
                         previewMode === 'qr' ? "text-white" : "text-blue-400 hover:text-blue-600"
                       )}
                     >
                        QR Code
                     </button>
                  </div>
               )}

               {(step === 'design' || previewMode === 'qr') && selectedType ? (
                  <div className="w-full max-w-[340px] animate-in zoom-in-95 duration-500 flex flex-col items-center">
                    <div className="bg-white p-8 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 mb-8 w-full aspect-square flex items-center justify-center">
                       <div className="w-full h-full flex items-center justify-center">
                          <QRCodePreview config={config} isValid={true} />
                       </div>
                    </div>
                    <div className="text-center space-y-4">
                       <div className="px-4 py-2 bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full flex items-center gap-2 shadow-sm border border-blue-100/50">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                          Check Live Dynamic Page
                       </div>
                       <div className="pt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Live Designer</p>
                          <h4 className="text-lg font-bold text-slate-900 leading-tight">Watch your scan transform</h4>
                       </div>
                    </div>
                  </div>
               ) : (
                  <div className="relative group">
                    {/* Phone Mockup Case */}
                    <div className="relative w-[300px] aspect-[9/18.5] bg-slate-900 rounded-[55px] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-[1px] border-slate-800">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-40 border-x border-b border-slate-800" />
                      
                      {/* Screen */}
                      <div className="relative w-full h-full bg-white rounded-[44px] overflow-hidden flex flex-col">
                        <div className="h-10 px-8 flex items-center justify-between text-[11px] font-bold text-slate-900 pt-3 shrink-0">
                            <span>9:41</span>
                            <div className="flex gap-1.5 items-center">
                              <div className="flex gap-0.5">
                                <div className="w-0.5 h-2 bg-slate-900 rounded-full" />
                                <div className="w-0.5 h-2.5 bg-slate-900 rounded-full" />
                                <div className="w-0.5 h-1.5 bg-slate-900 rounded-full opacity-30" />
                              </div>
                              <Wifi className="w-3 h-3" />
                              <div className="w-5 h-2.5 border border-slate-900 rounded-[3px] p-[1px] flex items-center">
                                <div className="w-full h-full bg-slate-900 rounded-[1px]" />
                              </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
                            {(step === 'type' ? (hoveredType || selectedType) : selectedType) ? (
                               <div key={step === 'type' ? (hoveredType || selectedType) : selectedType} className="min-h-full animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col">
                                  <DynamicView 
                                    data={step === 'type' && hoveredType ? { type: hoveredType } as any : config.data} 
                                    isWizardPreview={true} 
                                  />
                               </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in duration-1000 p-6 pt-10">
                                 {/* Screenshot specific QR Placeholder */}
                                 <div className="relative w-full aspect-square border-2 border-dashed border-slate-100 rounded-[40px] flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                                    <div className="w-48 h-48 bg-slate-50 rounded-3xl flex flex-col items-center justify-center border border-slate-100 relative group">
                                       <div className="absolute inset-4 border-[10px] border-slate-900 rounded-lg"></div>
                                       <div className="absolute top-8 right-8 w-8 h-8 bg-slate-900"></div>
                                       <div className="absolute bottom-8 left-8 w-8 h-8 bg-slate-900"></div>
                                       <div className="absolute top-8 left-8 w-8 h-8 bg-slate-900"></div>
                                       <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-[10px] font-bold text-slate-900 border border-slate-100 z-10 transition-transform group-hover:scale-110">
                                          LOGO
                                       </div>
                                       {/* Random dots for QR feel */}
                                       <div className="absolute inset-12 grid grid-cols-6 gap-1 opacity-20">
                                          {[...Array(36)].map((_, i) => (
                                            <div key={i} className={`w-full aspect-square bg-slate-900 rounded-[1px] ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`} />
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-slate-900 leading-none">Select a type of QR code on the left</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-10">Start your journey here</p>
                                 </div>
                              </div>
                            )}
                        </div>
                        {/* Home Indicator */}
                        <div className="h-1 w-24 bg-slate-900 rounded-full mx-auto mb-3 shrink-0" />
                      </div>
                    </div>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsHelpOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative">
               <div className={cn("h-64 flex items-center justify-center relative overflow-hidden", HELP_CONTENT[step].color)}>
                  <img src={HELP_CONTENT[step].image} className="w-full h-full object-cover mix-blend-overlay opacity-40 absolute inset-0" />
                  <div className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
                     {React.createElement(HELP_CONTENT[step].icon, { className: "w-12 h-12 text-white" })}
                  </div>
               </div>

               <div className="p-10 text-center space-y-6">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{HELP_CONTENT[step].title}</h3>
                     <p className="text-slate-500 font-medium leading-relaxed px-4">
                        {HELP_CONTENT[step].description}
                     </p>
                  </div>

                  <button 
                    onClick={() => setIsHelpOpen(false)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                  >
                    Got it, thanks!
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreationWizard;
