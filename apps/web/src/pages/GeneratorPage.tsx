import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { QRConfiguration, QRType } from '../types/qr';
import QRCodePreview from '../components/QRCodePreview';
import ExportPanel from '../components/ExportPanel';
import ContentPanel from '../components/panels/ContentPanel';
import DesignPanel from '../components/panels/DesignPanel';
import ColorsPanel from '../components/panels/ColorsPanel';
import LogoPanel from '../components/panels/LogoPanel';
import FramePanel from '../components/panels/FramePanel';
import AuthModal from '../components/AuthModal';
import {
  Type,
  Zap,
  Globe,
  Mail,
  Smartphone,
  Wifi,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Image as ImageIcon,
  Palette,
  Frame,
  Image as LogoIcon,
  LayoutGrid,
  type LucideIcon,
  ChevronLeft,
  FileText,
  Video,
  User,
  SmartphoneNfc,
  Music,
  Building2,
  UtensilsCrossed,
  Link2,
  Users,
  Ticket,
  Phone,
  Calendar
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import DynamicView from '../components/DynamicView';
import { useCurrentUser } from '../hooks/useApi';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FAQ_DATA = [
  { q: "How do I ensure my QR code is scannable?", a: "Just keep the contrast high (dark code, light background) and avoid overly complex designs. Using the 'Q' or 'H' error correction levels in the Design panel helps." },
  { q: "Can I change the QR code design after generation?", a: "Yes, you can modify any settings in the panel and the preview will update instantly." },
  { q: "Are these QR codes free to use?", a: "Yes, you can generate and export QR codes for personal and commercial use directly from this platform." },
  { q: "What format should I download?", a: "PNG is great for digital use (social media/web), while SVG is recommended for print as it can be scaled to any size without losing quality." }
];

const INITIAL_CONFIG: QRConfiguration = {
  data: {
    type: 'url',
    url: 'https://qr-thrive.com',
  },
  design: {
    dots: {
      type: 'square',
      color: '#000000',
    },
    cornersSquare: {
      type: 'square',
      color: '#000000',
    },
    cornersDot: {
      type: 'dot',
      color: '#000000',
    },
    background: {
      color: '#ffffff',
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
    },
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: 'Q',
    },
  },
  frame: {
    type: 'none',
    text: 'SCAN ME',
    color: '#000000',
    textColor: '#ffffff'
  },
  width: 400,
  height: 400,
  margin: 20,
  isDynamic: false,
  shortId: '7KxR9p',
};

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

interface QRTypeOption {
  id: QRType;
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
  { id: 'booking', icon: Calendar, title: 'Booking', description: 'Enable online bookings', category: 'dynamic' },
  { id: 'wifi', icon: Wifi, title: 'WiFi', description: 'Connect to a Wi-Fi network', category: 'static' },
];

function GeneratorPage() {
  const { data: userData } = useCurrentUser();
  const user = userData?.user;
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<'type' | 'content' | 'design'>('type');
  const [hoveredType, setHoveredType] = useState<QRType | null>(null);
  const [config, setConfig] = useState<QRConfiguration>(INITIAL_CONFIG);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  const [designTab, setDesignTab] = useState<'shape' | 'frame' | 'logo' | 'colors'>('shape');
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const updateConfig = (updates: Partial<QRConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateData = (updates: any) => {
    setConfig(prev => {
      const typeChanged = updates.type && updates.type !== prev.data.type;
      const newType = updates.type || prev.data.type;
      
      const dynamicTypes: QRType[] = ['socials', 'event', 'image', 'pdf', 'vcard', 'business', 'video', 'facebook', 'instagram', 'whatsapp', 'mp3', 'menu', 'app', 'coupon', 'booking'];
      const shouldBeDynamic = dynamicTypes.includes(newType);

      if (typeChanged) {
        return {
          ...prev,
          data: { type: updates.type, ...updates } as any,
          isDynamic: shouldBeDynamic
        };
      }

      return {
        ...prev,
        data: { ...prev.data, ...updates } as any,
        isDynamic: shouldBeDynamic || prev.isDynamic
      };
    });
  };

  const updateDesign = (updates: any) => {
    setConfig(prev => ({
      ...prev,
      design: { ...prev.design, ...updates }
    }));
  };

  // Sync with localStorage so DynamicView can read it
  useEffect(() => {
    if (config.isDynamic && config.shortId) {
       localStorage.setItem(`qr_data_${config.shortId}`, JSON.stringify(config.data));
    }
  }, [config.data, config.isDynamic, config.shortId]);

  const handleNext = () => {
    if (step === 'type' && config.data.type) setStep('content');
    else if (step === 'content') setStep('design');
  };

  const handleBack = () => {
    if (step === 'content') setStep('type');
    else if (step === 'design') setStep('content');
  };

  // Auto-initialize from URL parameters (Integration with Vemtap)
  useEffect(() => {
    const typeParam = searchParams.get('type') as QRType | null;
    const urlParam = searchParams.get('url');

    if (typeParam === 'url' && urlParam) {
      updateData({ type: 'url', url: urlParam });
      setStep('content');
    }
  }, [searchParams]);


  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Navigation */}
      <PublicNav />

      {/* Hero with Generator Card */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">

          {/* This is the Main Generator Card - The 1-2-3 Psychology Container */}
          <div className="bg-white rounded-[40px] shadow-[0_30px_1000px_rgba(37,99,235,0.06)] border border-gray-100 flex flex-col lg:flex-row relative min-h-[600px] lg:min-h-[700px] overflow-visible">
            {/* Left Content Column */}
            <div className="flex-1 min-w-0 p-5 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
              
              {/* Stepper Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5">
                  {(['type', 'content', 'design'] as const).map((s, idx) => (
                    <div key={s} className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                        step === s ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                        (idx < ['type', 'content', 'design'].indexOf(step) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400")
                      )}>
                        {idx + 1}
                      </div>
                      {idx < 2 && (
                        <div className={cn(
                          "w-6 h-0.5 mx-1 rounded-full",
                          idx < ['type', 'content', 'design'].indexOf(step) ? "bg-gray-900" : "bg-gray-100"
                        )} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="h-4 w-px bg-gray-100 mx-2" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-none">
                    {step === 'type' && "Choose Type"}
                    {step === 'content' && "Add Content"}
                    {step === 'design' && "Design QR"}
                  </h2>
                </div>
              </div>

              {/* Step Content Area */}
              <div className="flex-1">
                {step === 'type' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {qrTypes.map(type => (
                        <button
                          key={type.id}
                          onMouseEnter={() => setHoveredType(type.id)}
                          onMouseLeave={() => setHoveredType(null)}
                          onClick={() => {
                            updateData({ type: type.id });
                            setHoveredType(null);
                            handleNext();
                          }}
                          className={cn(
                            "flex flex-col items-center text-center p-4 rounded-[24px] border-2 transition-all hover:scale-[1.02] active:scale-[0.98] group relative",
                            config.data.type === type.id 
                              ? "border-blue-600 bg-blue-50/10 shadow-sm" 
                              : "border-gray-50 bg-gray-50/50 hover:border-blue-100"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-2",
                            config.data.type === type.id 
                              ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                              : "bg-white text-gray-400 group-hover:text-blue-600"
                          )}>
                            <type.icon className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-gray-900 text-[11px] tracking-tight mb-1">{type.title}</span>
                          <span className="text-[9px] text-gray-500 leading-tight px-1">{type.description}</span>
                          {type.category === 'dynamic' && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'content' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <ContentPanel config={config} updateData={updateData} hideTypeSelector={true} />
                  </div>
                )}

                {step === 'design' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                      {(['shape', 'frame', 'logo'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setDesignTab(tab)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            designTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          {tab === 'shape' && <Palette className="w-4 h-4" />}
                          {tab === 'frame' && <Frame className="w-4 h-4" />}
                          {tab === 'logo' && <LogoIcon className="w-4 h-4" />}
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-50">
                      {designTab === 'shape' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <DesignPanel design={config.design} updateDesign={updateDesign} />
                          <ColorsPanel design={config.design} updateDesign={updateDesign} />
                        </div>
                      )}
                      {designTab === 'frame' && <FramePanel config={config} updateConfig={updateConfig} />}
                      {designTab === 'logo' && <LogoPanel config={config} updateConfig={updateConfig} />}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between sticky bottom-0 bg-white/80 backdrop-blur-md pb-6 lg:static lg:bg-transparent lg:pb-0 z-40">
                <button
                  onClick={handleBack}
                  disabled={step === 'type'}
                  className={cn(
                    "px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    step === 'type' ? "opacity-0 pointer-events-none" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={step === 'design'}
                  className={cn(
                    "px-10 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg",
                    step === 'design' ? "opacity-0 pointer-events-none" : "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95"
                  )}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Preview Column */}
            <div className={cn(
              "w-full lg:w-[440px] bg-[#F8FAFC] relative shrink-0 transition-all duration-500 overflow-hidden lg:overflow-visible lg:block self-stretch",
              showMobilePreview ? "fixed inset-0 z-[100] h-screen bg-white" : "h-0 lg:h-auto"
            )}>
              <div className={cn(
                "lg:sticky lg:top-28 w-full p-6 sm:p-10 lg:p-12 flex flex-col items-center",
                showMobilePreview ? "h-full" : ""
              )}>
                
                {showMobilePreview && (
                  <button 
                    onClick={() => setShowMobilePreview(false)}
                    className="lg:hidden absolute top-6 right-6 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center z-[110] shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                
                {step === 'design' ? (
                  <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-center gap-3 mb-8">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-200">3</div>
                      <h2 className="text-xl font-bold text-gray-900">Preview & Download</h2>
                    </div>

                    <div className="w-full max-w-[280px] mb-10 transform group transition-all duration-500 hover:scale-[1.02]">
                       <div className="bg-white p-6 rounded-[40px] shadow-2xl shadow-blue-100/50 border border-white aspect-square flex items-center justify-center relative">
                          {config.isDynamic && !user ? (
                            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md rounded-[40px] flex flex-col items-center justify-center p-6 text-center space-y-4">
                              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <Zap className="w-6 h-6 fill-blue-600" />
                              </div>
                              <h4 className="text-sm font-bold text-gray-900">Signup for Dynamic QR</h4>
                              <button 
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100"
                              >
                                Join Free
                              </button>
                            </div>
                          ) : null}
                          <QRCodePreview config={config} isValid={true} />
                       </div>
                    </div>

                    <div className="w-full space-y-4 max-w-[280px]">
                      <ExportPanel 
                        config={config} 
                        hasUser={!!user} 
                        isValid={true}
                        onAuthRequired={() => setIsAuthModalOpen(true)} 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative group animate-in fade-in slide-in-from-right-8 duration-700 w-full flex flex-col items-center">
                    {/* Phone Mockup Case - Scaled for better mobile fit */}
                    <div className="relative w-[280px] h-[575px] sm:w-[300px] sm:h-[615px] bg-gray-900 rounded-[50px] p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border-[1px] border-gray-800 overflow-hidden shrink-0 scale-90 sm:scale-100 origin-top">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-xl z-40 border-x border-b border-gray-800" />
                      
                      {/* Screen */}
                      <div className={cn(
                        "relative w-full h-full rounded-[40px] overflow-hidden flex flex-col transition-colors duration-500",
                        config.data.type === 'url' ? "" : "bg-white"
                      )} style={{ backgroundColor: config.data.type === 'url' ? (config.data.urlPreview?.themeColor || '#00C9E0') : undefined }}>
                        <div className="h-8 px-6 flex items-center justify-between text-[9px] font-bold text-gray-900 pt-2 shrink-0">

                            <span>9:41</span>
                            <div className="flex gap-1 items-center">
                              <Wifi className="w-2.5 h-2.5" />
                              <div className="w-4 h-2 border border-gray-900 rounded-[2px] p-[0.5px]">
                                <div className="w-full h-full bg-gray-900 rounded-[0.5px]" />
                              </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col relative">
                            {(step === 'type' ? (hoveredType || config.data.type) : config.data.type) ? (

                               <div key={step === 'type' ? (hoveredType || config.data.type) : config.data.type} className="min-h-full animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col">
                                  <DynamicView 
                                    data={step === 'type' && hoveredType ? { type: hoveredType } as any : config.data} 
                                    isWizardPreview={true} 
                                  />
                               </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-6">
                                 <div className="w-32 h-32 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 relative">
                                    <div className="absolute inset-4 border-4 border-gray-200 rounded-md"></div>
                                    <LayoutGrid className="w-8 h-8 text-gray-200" />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-gray-900">Select a QR Type</h3>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Preview logic here</p>
                                 </div>
                              </div>
                            )}
                        </div>
                        <div className="h-1 w-20 bg-gray-900 rounded-full mx-auto mb-2 shrink-0" />
                      </div>
                    </div>
                    
                    {/* Badge */}
                    <div className="absolute -bottom-6 -right-6 lg:right-4 bg-white p-4 rounded-3xl shadow-xl border border-gray-50 flex items-center gap-3 animate-bounce">
                      <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                        <Zap className="w-4 h-4 fill-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase leading-none">Live Dynamic</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Real-time update</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Mobile Preview Toggle */}
          <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none">
             <button 
              onClick={() => setShowMobilePreview(true)}
              className="flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-[24px] font-bold shadow-2xl shadow-blue-200 active:scale-95 transition-all text-sm whitespace-nowrap border-4 border-white pointer-events-auto"
             >
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                   <Zap className="w-4 h-4 fill-white animate-pulse" />
                </div>
                Live Preview
             </button>
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4">
                <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Editing Live</span>
                </div>
             </div>
          </div>
        </div>
      </section>


      {/* Benefits Content Section */}
      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
              <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100">Features & Benefits</div>
              <h2 className="text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">The ultimate toolkit for your QR Marketing</h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">Our platform isn't just a generator; it's a full-scale marketing engine designed to convert physical scans into digital customers.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                {[
                  'Edit destination URL anytime',
                  'Advanced scan tracking',
                  'Device & OS analysis',
                  'Real-time data dashboard',
                  'High-res vector exports',
                  'Enterprise-grade security'
                ].map(item => (
                  <div key={item} className="flex items-center gap-4 text-gray-800 font-semibold">
                    <div className="bg-blue-600 text-white p-1 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <button className="group px-10 py-5 bg-blue-600 text-white rounded-[20px] font-bold flex items-center gap-3 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95 text-lg">
                Start Building Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="relative group">
              <div className="absolute -inset-10 bg-blue-500 rounded-[80px] blur-[100px] opacity-10 -z-10 group-hover:opacity-20 transition-opacity" />
              <div className="bg-gray-50 border border-gray-100 rounded-[60px] p-16 lg:p-24 relative overflow-hidden shadow-inner flex items-center justify-center">
                <div className="grid grid-cols-2 gap-12">
                   <FeatureIconItem icon={Globe} title="URL Link" color="bg-blue-100 text-blue-600 shadow-lg shadow-blue-200/50" />
                   <FeatureIconItem icon={Wifi} title="Smart Wifi" color="bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-200/50" />
                   <FeatureIconItem icon={Mail} title="Email Hub" color="bg-amber-100 text-amber-600 shadow-lg shadow-amber-200/50" />
                   <FeatureIconItem icon={Smartphone} title="App Store" color="bg-rose-100 text-rose-600 shadow-lg shadow-rose-200/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Comparison Section */}
      <section className="py-32 px-4 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
             <div className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] border border-blue-200 mb-6">Comparison</div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">Static or Dynamic?</h2>
            <p className="text-gray-500 font-medium text-lg">Understand the power of real-time QR management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            <ComparisonCard 
              type="BASIC" 
              title="Static QR Code"
              description="Information is encoded directly into the pattern. Permanent, unchanging, and perfect for simple needs."
              points={[
                'Permanent link destination',
                'No tracking data available',
                'Free forever, no account',
                'Unlimited scans'
              ]}
              icon={Clock}
              btnText="Create Static QR"
            />
            <ComparisonCard 
              type="ENTERPRISE" 
              title="Dynamic QR Code"
              description="Stored via short-link redirect. Ultimate flexibility to update content without reprinting."
              points={[
                'Change URL destination anytime',
                'Full geographical scan tracking',
                'Advanced device analytics',
                'Password & date protection'
              ]}
              icon={BarChart3}
              isPremium
              btnText="Go Dynamic Free"
            />
          </div>
        </div>
      </section>

      {/* QR Types Grid */}
      <section className="py-32 px-4 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">Explore the full ecosystem</h2>
            <p className="text-gray-500 font-medium text-lg">Every scan is a new opportunity to connect with your audience.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            <QRTypeCard icon={Globe} title="Website Link" desc="Redirect users to any URL, landing page, or store." />
            <QRTypeCard icon={Mail} title="Email Lead" desc="Pre-fill subject and body for instant lead gen." />
            <QRTypeCard icon={Smartphone} title="Digital vCard" desc="Share contact info and follow buttons instantly." />
            <QRTypeCard icon={Wifi} title="Direct Wifi" desc="Let guests scan to join your network securely." />
            <QRTypeCard icon={Type} title="Social Connect" desc="Aggregate all your social presence in one scan." />
            <QRTypeCard icon={ImageIcon} title="Rich Media" desc="Display gorgeous image galleries or PDFs." />
            <QRTypeCard icon={Zap} title="App Deep Link" desc="Smart routing based on user's device OS." />
            <QRTypeCard icon={Shield} title="Secure Auth" desc="Use QR for MFA and secure verification flows." />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ_DATA.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                className="w-full flex justify-between items-center p-5 text-left font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {item.q}
                <ChevronRight className={cn("w-5 h-5 transition-transform text-gray-400", faqOpenIndex === i && "rotate-90")} />
              </button>
              {faqOpenIndex === i && (
                <div className="p-5 border-t border-gray-100 text-gray-600 bg-gray-50/50 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {}} // useCurrentUser handles this
      />
    </div>
  );
}

// Helper Components
function FeatureIconItem({ icon: Icon, title, color }: { icon: LucideIcon, title: string, color: string }) {
  return (
    <div className="flex flex-col items-center gap-6 group">
      <div className={cn("w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-110", color)}>
        <Icon className="w-10 h-10" />
      </div>
      <span className="text-xs font-bold text-gray-900 tracking-[0.1em] uppercase">{title}</span>
    </div>
  );
}

function ComparisonCard({ type, title, description, points, icon: Icon, isPremium, btnText }: any) {
  return (
    <div className={cn(
      "p-12 lg:p-16 rounded-[60px] border transition-all duration-700",
      isPremium ? "bg-white border-blue-600/5 shadow-[0_40px_100px_rgba(37,99,235,0.1)] scale-105 relative z-10" : "bg-white/50 border-gray-100 hover:border-blue-100"
    )}>
      <div className="flex justify-between items-start mb-12">
        <div className={cn("p-5 rounded-[28px]", isPremium ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600")}>
          <Icon className="w-10 h-10" />
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-[0.3em] px-5 py-2 rounded-full", isPremium ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-500")}>
          {type}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-6">{title}</h3>
      <p className="text-gray-500 text-base mb-10 font-medium leading-relaxed">{description}</p>
      
      <ul className="space-y-6 mb-12">
        {points.map((point: string) => (
          <li key={point} className="flex items-center gap-4 text-sm font-semibold text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {point}
          </li>
        ))}
      </ul>
      
      <button className={cn(
        "w-full py-5 rounded-[24px] font-bold transition-all active:scale-95 text-base uppercase tracking-widest",
        isPremium ? "bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-200" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
      )}>
        {btnText}
      </button>
    </div>
  );
}

function QRTypeCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-10 rounded-[40px] border border-gray-100 bg-white hover:border-blue-600/10 hover:shadow-[0_30px_60px_rgba(37,99,235,0.06)] transition-all duration-500 group cursor-pointer">
      <div className="w-16 h-16 bg-gray-50 text-gray-900 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-xl group-hover:shadow-blue-200 transition-all duration-500">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="font-bold text-gray-900 text-xl mb-4 leading-tight">{title}</h4>
      <p className="text-sm text-gray-400 font-semibold leading-relaxed">{desc}</p>
    </div>
  );
}

export default GeneratorPage;
