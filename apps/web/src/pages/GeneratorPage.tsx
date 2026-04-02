import { useState, useEffect } from 'react';
import type { QRConfiguration, QRType } from '../types/qr';
import QRCodePreview from '../components/QRCodePreview';
import ExportPanel from '../components/ExportPanel';
import ContentPanel from '../components/panels/ContentPanel';
import DesignPanel from '../components/panels/DesignPanel';
import ColorsPanel from '../components/panels/ColorsPanel';
import LogoPanel from '../components/panels/LogoPanel';
import FramePanel from '../components/panels/FramePanel';
import AuthModal from '../components/AuthModal';
import { isQRDataValid } from '../utils/qrValidation';
import {
  Type,
  LogOut,
  Zap,
  Globe,
  Mail,
  Smartphone,
  Wifi,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  Briefcase,
  Camera,
  BarChart3,
  LayoutGrid,
  Image as ImageIcon,
  type LucideIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../hooks/useApi';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_CONFIG: QRConfiguration = {
  data: {
    type: 'url',
    url: window.location.origin,
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
  width: 300,
  height: 300,
  margin: 15,
  isDynamic: false,
  shortId: '7KxR9p',
};

function GeneratorPage() {
  const navigate = useNavigate();
  const { data: userData } = useCurrentUser();
  const logoutMutation = useLogout();
  const user = userData?.user;
  
  const [config, setConfig] = useState<QRConfiguration>(INITIAL_CONFIG);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [designTab, setDesignTab] = useState<'shape' | 'frame' | 'logo'>('shape');

  const updateConfig = (updates: Partial<QRConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateData = (updates: any) => {
    setConfig(prev => {
      const typeChanged = updates.type && updates.type !== prev.data.type;
      const newType = updates.type || prev.data.type;
      
      const dynamicTypes: QRType[] = ['socials', 'event', 'image'];
      const shouldBeDynamic = dynamicTypes.includes(newType);

      if (typeChanged) {
        return {
          ...prev,
          data: { type: updates.type } as any,
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

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <Zap className="text-white w-5 h-5 fill-yellow-300" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">QR Thrive</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {user && (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" /> Go to Dashboard
                </button>
              )}
              <a href="#" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="#" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Solutions</a>
              <a href="#" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">API</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                  </div>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setIsAuthModalOpen(true)} className="px-5 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-full transition-all">Log In</button>
                  <button onClick={() => setIsAuthModalOpen(true)} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-md active:scale-95">Sign Up Free</button>
                </>
              )}
            </div>

            <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero with Generator Card */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">

          {/* This is the Main Generator Card - The 1-2-3 Psychology Container */}
          <div className="bg-white rounded-[40px] shadow-[0_30px_1000px_rgba(37,99,235,0.06)] border border-gray-100 flex flex-col lg:flex-row relative">
            {/* Left Content Column (Steps 1 & 2) */}
            <div className="flex-1 min-w-0 p-6 sm:p-10 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-100 rounded-t-[40px] lg:rounded-r-none lg:rounded-l-[40px] overflow-hidden">
              {/* Step 1: Content Type */}
              <div className="mb-1">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200">1</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-none mb-1">Choose Content</h2>
                    {/* <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Complete the details below</p> */}
                  </div>
                </div>
                <div className="bg-gray-50/50 p-6 sm:p-10 rounded-[32px] border border-gray-50">
                   <ContentPanel config={config} updateData={updateData} />
                </div>
              </div>

              <div className="h-px bg-gray-50/50 w-full mb-1" />

              {/* Step 2: Design */}
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200">2</div>
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 leading-none mb-1">Design Your QR</h2>
                      {/* <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Customize frames, shapes & logos</p> */}
                    </div>
                    {/* Tabs for Design Section */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl md:mt-0 transition-all">
                      <button
                        onClick={() => setDesignTab('shape')}
                        className={cn(
                          "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                          designTab === 'shape' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Shape
                      </button>
                      <button
                        onClick={() => setDesignTab('frame')}
                        className={cn(
                          "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                          designTab === 'frame' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Frame
                      </button>
                      <button
                        onClick={() => setDesignTab('logo')}
                        className={cn(
                          "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                          designTab === 'logo' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Logo
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50/50 rounded-[32px] p-6 sm:p-10 border border-gray-50 overflow-hidden max-w-full">
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    {designTab === 'shape' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <DesignPanel design={config.design} updateDesign={updateDesign} />
                        <ColorsPanel design={config.design} updateDesign={updateDesign} />
                      </div>
                    )}
                    {designTab === 'frame' && (
                      <FramePanel config={config} updateConfig={updateConfig} />
                    )}
                    {designTab === 'logo' && (
                      <LogoPanel config={config} updateConfig={updateConfig} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Preview Column (Step 3) */}
            <div className="w-full lg:w-[480px] bg-gray-50/40 p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-start min-h-[500px] rounded-b-[40px] lg:rounded-l-none lg:rounded-r-[40px]">
              <div className="sticky top-24 w-full flex flex-col items-center">
                <div className="flex items-center justify-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200">3</div>
                  <h2 className="text-2xl font-bold text-gray-900">Download Ready</h2>
                </div>
                
                <div className="w-full max-w-[300px] mb-12 transform group transition-all duration-500 hover:scale-[1.02]">
                  {config.isDynamic && !user ? (
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-blue-100 flex flex-col items-center text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Zap className="w-8 h-8 fill-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-gray-900 leading-tight">Signup Required</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">To create dynamic QRs</p>
                      </div>
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all"
                      >
                         Unlock Now
                      </button>
                    </div>
                  ) : (
                    <QRCodePreview config={config} isValid={isQRDataValid(config.data)} />
                  )}
                </div>
 
                <div className="w-full space-y-5 max-w-[300px]">
                  <ExportPanel 
                    config={config} 
                    hasUser={!!user} 
                    isValid={isQRDataValid(config.data)}
                    onAuthRequired={() => setIsAuthModalOpen(true)} 
                  />
                  
                </div>

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

      {/* Footer */}
      <footer className="bg-blue-600 py-24 px-4 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-24">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="text-white w-6 h-6 fill-yellow-300" />
                </div>
                <span className="text-2xl font-bold tracking-tighter">QR Thrive</span>
              </div>
              <p className="text-blue-100 max-w-xs mb-10 font-medium leading-relaxed">Modernize your business interactions with the world's most intuitive QR management engine.</p>
              <div className="flex gap-5">
                <SocialIcon icon={Globe} />
                <SocialIcon icon={MessageSquare} />
                <SocialIcon icon={Camera} />
                <SocialIcon icon={Briefcase} />
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-sm uppercase tracking-[0.2em] mb-8 text-blue-200">Product</h4>
              <ul className="space-y-5 text-blue-100 text-sm font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">QR Generator</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dynamic Links</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics Pro</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing Plans</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-[0.2em] mb-8 text-blue-200">Company</h4>
              <ul className="space-y-5 text-blue-100 text-sm font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">About Story</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Product Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Join Team</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm uppercase tracking-[0.2em] mb-8 text-blue-200">Legal</h4>
              <ul className="space-y-5 text-blue-100 text-sm font-semibold">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Guard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Usage Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-blue-500/30 flex flex-col md:flex-row justify-between items-center gap-8 text-blue-200 text-[10px] font-bold uppercase tracking-[0.3em]">
            <p>© 2026 QR Thrive Enterprise. Built for the future of physical interactions.</p>
            <div className="flex gap-10">
              <span className="hover:text-white cursor-pointer">System Status</span>
              <span className="hover:text-white cursor-pointer">Security Compliance</span>
            </div>
          </div>
        </div>
      </footer>

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

function SocialIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <button className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-100 hover:bg-white/20 hover:text-white hover:-translate-y-1 transition-all border border-white/5">
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default GeneratorPage;
