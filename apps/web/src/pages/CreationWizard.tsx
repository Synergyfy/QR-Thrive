import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Smartphone,
  Globe,
  FileText,
  Image as ImageIcon,
  Video,
  User,
  Share2,
  SmartphoneNfc,
  Music,
  Building2,
  UtensilsCrossed,
  Calendar,
  CheckCircle2,
  Zap,
  Palette,
  Image as LogoIcon,
  Frame,
  Loader2,
  ClipboardList,
  Phone
} from 'lucide-react';
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
import { useQRCode, useCreateQRCode, useUpdateQRCode } from '../hooks/useApi';
import { uploadAllPendingFiles } from '../utils/upload';
import { uploadApi } from '../services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Step = 'type' | 'content' | 'design';

interface QRTypeOption {
  id: string;
  icon: any;
  title: string;
  description: string;
  category: 'dynamic' | 'static';
}

const qrTypes: QRTypeOption[] = [
  { id: 'url', icon: Globe, title: 'Website URL', description: 'Link to any Website URL', category: 'static' },
  { id: 'pdf', icon: FileText, title: 'PDF', description: 'Share PDF document', category: 'dynamic' },
  { id: 'image', icon: ImageIcon, title: 'Images', description: 'Share multiple images', category: 'dynamic' },
  { id: 'video', icon: Video, title: 'Video', description: 'Share a video', category: 'dynamic' },
  { id: 'vcard', icon: User, title: 'Profile Card', description: 'Personal custom page', category: 'dynamic' },
  { id: 'socials', icon: Share2, title: 'Multiple Links', description: 'A tree for all your socials', category: 'dynamic' },
  { id: 'app', icon: SmartphoneNfc, title: 'App', description: 'Download apps Android & iOS', category: 'dynamic' },
  { id: 'mp3', icon: Music, title: 'MP3', description: 'Share an audio file', category: 'dynamic' },
  { id: 'business', icon: Building2, title: 'Business Page', description: 'Information about your business', category: 'dynamic' },
  { id: 'menu', icon: UtensilsCrossed, title: 'Menu', description: 'Share digital menu', category: 'dynamic' },
  { id: 'event', icon: Calendar, title: 'Event', description: 'Promote your next event', category: 'dynamic' },
  { id: 'whatsapp', icon: Phone, title: 'WhatsApp', description: 'Chat with us on WhatsApp', category: 'dynamic' },
  { id: 'form', icon: ClipboardList, title: 'Form', description: 'Create a custom form', category: 'dynamic' },
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
  const [config, setConfig] = useState<QRConfiguration>(INITIAL_CONFIG);
  const [designTab, setDesignTab] = useState<'shape' | 'frame' | 'logo' | 'colors'>('shape');

  // Load existing QR when editing
  useEffect(() => {
    if (editId) {
      if (existingQR) {
        setConfig(existingQR.config);
        setSelectedType(existingQR.config.data.type);
      }
    }
  }, [editId, existingQR]);

  // Sync types for new QRs
  useEffect(() => {
    if (selectedType && !isEditing) {
      setConfig(prev => ({
        ...prev,
        data: { ...prev.data, type: selectedType as any },
        isDynamic: true // All QR codes should be dynamic by default
      }));
    }
  }, [selectedType, isEditing]);

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
            margin: config.margin 
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
          margin: config.margin 
        });
        toast.success('QR Code created successfully!');
      }
      navigate('/dashboard');
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
      navigate('/dashboard');
    } else if (step === 'type') {
      navigate('/dashboard');
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
      <nav className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
               <CheckCircle2 className="w-6 h-6" />
             </div>
             <span className="text-xl font-black text-slate-900 tracking-tighter">QR Thrive</span>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-8">
             {steps.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3">
                   <div className={cn(
                     "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all",
                     step === s.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                     steps.findIndex(x => x.id === step) > idx ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                   )}>
                      {idx + 1}
                   </div>
                   <span className={cn(
                     "text-sm font-bold tracking-tight",
                     step === s.id ? "text-slate-900" : "text-slate-400"
                   )}>{s.label}</span>
                   {idx < steps.length - 1 && <div className="h-px w-6 bg-slate-200 ml-2" />}
                </div>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
            onClick={handleBack}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
           >
              <ChevronLeft className="w-4 h-4" /> Back
           </button>
           <button 
            disabled={!selectedType || isSaving}
            onClick={handleNext}
            className={cn(
              "px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl min-w-[140px] justify-center",
              selectedType ? "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
           >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {step === 'design' ? (isEditing ? 'Save Changes' : 'Finish') : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
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
                    <div className="space-y-1">
                       <h1 className="text-3xl font-black text-slate-900 tracking-tight">Choose your QR Code type</h1>
                       <p className="text-slate-400 font-medium">Select what you want the user to see after scanning.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                       {qrTypes.map(type => (
                          <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={cn(
                              "flex items-center gap-5 p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] group text-left",
                              selectedType === type.id 
                                ? "border-blue-600 bg-blue-50/10 ring-4 ring-blue-50/50" 
                                : "border-white bg-white hover:border-slate-100 shadow-sm"
                            )}
                          >
                             <div className={cn(
                               "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                               selectedType === type.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                             )}>
                                <type.icon className="w-7 h-7" />
                             </div>
                             <div className="flex-1">
                                <h3 className="font-bold text-slate-900 leading-none mb-1">{type.title}</h3>
                                <p className="text-xs font-medium text-slate-400">{type.description}</p>
                             </div>
                             {type.category === 'dynamic' && (
                                <div className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-md">Dynamic</div>
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
                           <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                              {isEditing ? 'Edit Content' : qrTypes.find(t => t.id === selectedType)?.title}
                           </h1>
                           <p className="text-slate-400 font-medium">
                              {isEditing ? 'Update the information for your QR Code.' : 'Complete the information for your QR Code.'}
                           </p>
                        </div>
                        {!isEditing && (
                          <button className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-blue-100">
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
                       <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                          {isEditing ? 'Edit Design' : 'QR Code Design'}
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
                                "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
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
         <div className="fixed top-20 right-0 bottom-0 w-[480px] bg-white border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-30 p-12 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar">
            <div className="w-full flex flex-col items-center">
               <button className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black tracking-widest text-[10px] uppercase flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 mb-12 hover:scale-[1.02] transition-all active:scale-95 group">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  {step === 'design' ? 'QR Code Preview' : 'Landing Page Preview'}
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </button>

               {step === 'design' ? (
                  <div className="w-full max-w-[340px] animate-in zoom-in-95 duration-500 flex flex-col items-center">
                    <div className="bg-white p-8 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-50 mb-8 w-full aspect-square flex items-center justify-center">
                       <div className="w-full h-full flex items-center justify-center">
                          <QRCodePreview config={config} isValid={true} />
                       </div>
                    </div>
                    <div className="text-center space-y-4">
                       <div className="px-4 py-2 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 shadow-sm border border-blue-100/50">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                          Check Live Dynamic Page
                       </div>
                       <div className="pt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Live Designer</p>
                          <h4 className="text-lg font-bold text-slate-900 leading-tight">Watch your scan transform</h4>
                       </div>
                    </div>
                  </div>
               ) : (
                  <div className="relative w-[300px] aspect-[9/19] bg-white rounded-[60px] border-[12px] border-slate-900 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-700 shrink-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-20" />
                    <div className="h-10 px-8 flex items-center justify-between text-[11px] font-black text-slate-900 pt-3 shrink-0">
                        <span>9:41</span>
                        <div className="flex gap-2 items-center">
                          <Zap className="w-3 h-3 fill-blue-500 text-blue-500" />
                          <div className="w-4 h-2.5 border-2 border-slate-900 rounded-sm" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {selectedType ? (
                           <DynamicView data={config.data} isWizardPreview={true} />
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-30 bg-white">
                             <Smartphone className="w-16 h-16 text-slate-300" />
                             <p className="text-xs font-black text-slate-400 px-10 leading-relaxed uppercase tracking-widest">Select a type to see result</p>
                          </div>
                        )}
                    </div>
                    <div className="h-1.5 w-28 bg-slate-900 rounded-full mx-auto mb-3 shrink-0" />
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default CreationWizard;
