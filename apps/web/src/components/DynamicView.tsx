import React from 'react';
import { 
  Globe, 
  Mail, 
  MessageSquare, 
  Phone, 
  Wifi, 
  User, 
  Share2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Type,
  Camera,
  FileText,
  Video,
  Music,
  ShoppingBag,
  Download,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';
import type { QRData } from '../types/qr';
import { useParams } from 'react-router-dom';
import { useSubmitForm } from '../hooks/useForms';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface DynamicViewProps {
  data: QRData;
  isWizardPreview?: boolean;
}

const DynamicView: React.FC<DynamicViewProps> = ({ data, isWizardPreview }) => {
  const { id: shortId } = useParams<{ id: string }>();
  const submitMutation = useSubmitForm(shortId || '');
  const [answers, setAnswers] = React.useState<Record<string, any>>({});
  const [submitted, setSubmitted] = React.useState(false);

  // If it's a simple URL, we can just redirect or show a card
  React.useEffect(() => {
    if (data.type === 'url' && data.url) {
       // Optional: Auto-redirect after 2 seconds
       // const timer = setTimeout(() => window.location.href = data.url!, 2000);
       // return () => clearTimeout(timer);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWizardPreview) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{7,15}$/;

    // Detailed validation
    const errors: string[] = [];
    
    data.form?.fields.forEach(f => {
      const value = answers[f.id];
      const isMissing = Array.isArray(value) ? value.length === 0 : (value === undefined || value === null || value === '');

      // Required check
      if (f.required && isMissing) {
        errors.push(`"${f.label}" is required`);
        return;
      }

      // Type-specific validation if value is present
      if (!isMissing) {
        if (f.type === 'email' && !emailRegex.test(String(value))) {
          errors.push(`"${f.label}" must be a valid email`);
        }
        if (f.type === 'phone' && !phoneRegex.test(String(value))) {
          errors.push(`"${f.label}" must be a valid phone number`);
        }
        if (f.type === 'number' || f.type === 'range') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`"${f.label}" must be a number`);
          } else if (f.validation) {
            const v = f.validation as any;
            if (v.min !== undefined && num < v.min) {
              errors.push(`"${f.label}" must be at least ${v.min}`);
            }
            if (v.max !== undefined && num > v.max) {
              errors.push(`"${f.label}" must be at most ${v.max}`);
            }
          }
        }
      }
    });

    if (errors.length > 0) {
      import('react-hot-toast').then(({ toast }) => {
        toast.error(errors[0]); // Show the first error for cleaner UX
      });
      return;
    }

    try {
      await submitMutation.mutateAsync(answers);
      setSubmitted(true);
    } catch (e) {}
  };

  const renderContent = () => {
    switch (data.type) {
      case 'url':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-100">
              <Globe className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Website Link</h1>
              <p className="text-gray-500 font-medium break-all">{data.url}</p>
            </div>
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
            >
              Visit Website
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        );

      case 'socials':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-100">
                <Share2 className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect with us</h1>
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Our Social Ecosystem</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data.socials && Object.entries(data.socials).map(([platform, url]) => {
                if (!url) return null;
                const config = getSocialConfig(platform);
                return (
                  <a 
                    key={platform}
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-3xl hover:border-blue-600 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                      <config.icon className={`w-6 h-6 ${config.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{platform}</p>
                       <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Open Profile</p>
                    </div>
                    <ChevronRight className="text-gray-300 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                );
              })}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                <Camera className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Image Gallery</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">Shared via QR Thrive</p>
            </div>

            <div className="bg-white p-2 rounded-[40px] border border-gray-100 shadow-2xl shadow-blue-100/50 overflow-hidden group">
               <div className="relative aspect-square sm:aspect-video rounded-[32px] overflow-hidden">
                  <img 
                    src={data.image?.url} 
                    alt="Gallery" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {data.image?.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                       <p className="text-white font-bold text-lg leading-tight transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 italic">"{data.image.caption}"</p>
                    </div>
                  )}
               </div>
            </div>

            {data.image?.caption && (
              <div className="bg-white p-6 rounded-3xl border border-gray-50 flex items-start gap-4 shadow-sm sm:hidden">
                 <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                    <Type className="w-4 h-4" />
                 </div>
                 <p className="text-xs font-semibold text-gray-600 leading-relaxed">"{data.image.caption}"</p>
              </div>
            )}
            
            <a 
              href={data.image?.url} 
              download="gallery-image"
              className="w-full py-5 bg-gray-50 text-gray-900 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-sm border border-gray-100 flex items-center justify-center gap-3 hover:bg-white active:scale-95 transition-all"
            >
              Save to Device
              <ExternalLink className="w-5 h-5 opacity-20" />
            </a>
          </div>
        );

       case 'wifi':
        return (
          <div className="text-center space-y-8">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100 animate-pulse">
               <Wifi className="w-12 h-12" />
            </div>
            <div>
               <h1 className="text-2xl font-bold text-gray-900 mb-4">Wi-Fi Connection</h1>
               <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                     <span className="text-xs font-bold text-gray-400 uppercase">Network</span>
                     <span className="font-bold text-gray-900">{data.wifi?.ssid}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-gray-400 uppercase">Security</span>
                     <span className="font-bold text-gray-900">{data.wifi?.encryption}</span>
                  </div>
               </div>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold leading-relaxed border border-emerald-100">
               Scan successful! Your device should automatically prompt you to join the network.
            </div>
          </div>
        );

      case 'vcard':
        return (
          <div className="space-y-8">
            <div className="text-center">
               <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-100">
                  <User className="w-12 h-12" />
               </div>
               <h1 className="text-3xl font-black text-gray-900 mb-2">{data.vcard?.firstName} {data.vcard?.lastName}</h1>
               <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Digital Contact Card</p>
            </div>

            <div className="space-y-3">
              {[
                { icon: Phone, label: 'Mobile', value: data.vcard?.mobile, href: `tel:${data.vcard?.mobile}` },
                { icon: Mail, label: 'Email', value: data.vcard?.email, href: `mailto:${data.vcard?.email}` },
                { icon: Globe, label: 'Website', value: data.vcard?.website, href: data.vcard?.website },
              ].map((item) => item.value ? (
                <a key={item.label} href={item.href} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-3xl hover:border-blue-600 transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                    <p className="font-bold text-gray-900">{item.value}</p>
                  </div>
                </a>
              ) : null)}
            </div>
            
            <button className="w-full py-5 bg-gray-900 text-white rounded-3xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-gray-200">
               Save Contact
               <Smartphone className="w-5 h-5" />
            </button>
          </div>
        );

       case 'text':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-100">
                <Type className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Message Content</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Encoded Plain Text</p>
            </div>
            <div className="bg-gray-50/80 backdrop-blur-sm p-8 rounded-[40px] border border-gray-100 shadow-inner">
               <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap text-lg italic text-center">"{data.text}"</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(data.text || '');
                alert('Copied to clipboard!');
              }}
              className="w-full py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-3xl font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Copy Text
            </button>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-100">
                <div className="w-12 h-12 flex items-center justify-center">
                   <svg className="w-full h-full fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </div>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">WhatsApp Contact</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">Instant Conversation</p>
            </div>
            
            {data.whatsapp?.message && (
               <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                     <MessageSquare className="w-12 h-12" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-3">Your Message</p>
                  <p className="text-emerald-900 font-bold leading-relaxed">"{data.whatsapp?.message}"</p>
               </div>
            )}

            <a 
              href={`https://wa.me/${(data.whatsapp?.phoneNumber ? (data.whatsapp?.countryCode || '').replace(/\D/g, '') + data.whatsapp.phoneNumber.replace(/\D/g, '').replace(/^0+/, '') : (data.whatsapp?.number || '').replace(/\D/g, ''))}?text=${encodeURIComponent(data.whatsapp?.message || '')}`}
              className="w-full py-5 bg-[#25D366] text-white rounded-[32px] font-black text-lg shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Message on WhatsApp
              <ChevronRight className="w-6 h-6" />
            </a>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                <Mail className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Send an Email</h1>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{data.email?.address}</p>
            </div>
            <div className="space-y-4">
               {data.email?.subject && (
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Subject</p>
                     <p className="text-gray-900 font-bold">{data.email?.subject}</p>
                  </div>
               )}
               {data.email?.body && (
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Message</p>
                     <p className="text-gray-700 font-medium whitespace-pre-wrap">{data.email?.body}</p>
                  </div>
               )}
            </div>
            <a 
              href={`mailto:${data.email?.address}?subject=${encodeURIComponent(data.email?.subject || '')}&body=${encodeURIComponent(data.email?.body || '')}`}
              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
            >
              Open Email App
              <Mail className="w-5 h-5" />
            </a>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-8 text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-50">
               <Phone className="w-12 h-12" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-gray-900 mb-2">Call Now</h1>
               <p className="text-2xl font-bold text-blue-600 tracking-tight">{data.phone?.number}</p>
            </div>
            <a 
              href={`tel:${data.phone?.number}`}
              className="w-full py-5 bg-blue-600 text-white rounded-[40px] font-black text-xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Start Call
              <Phone className="w-6 h-6 fill-current" />
            </a>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Send SMS</h1>
              <p className="text-gray-400 text-sm font-semibold">{data.sms?.number}</p>
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 italic text-indigo-900 font-medium leading-relaxed">
               "{data.sms?.message}"
            </div>
            <a 
              href={`sms:${data.sms?.number}?body=${encodeURIComponent(data.sms?.message || '')}`}
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-bold shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
            >
              Draft SMS
              <MessageSquare className="w-5 h-5" />
            </a>
          </div>
        );

       case 'instagram':
       case 'facebook':
       case 'twitter':
       case 'linkedin':
       case 'youtube':
       case 'tiktok':
         const platform = data.type;
         const username = data.social?.username || '';
         const config = getSocialConfig(platform);
         return (
           <div className="text-center space-y-8">
              <div className={`w-32 h-32 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl ${config.color} text-white`}>
                 <config.icon className="w-16 h-16" />
              </div>
              <div>
                 <h1 className="text-3xl font-black capitalize text-gray-900 mb-2">{platform}</h1>
                 <p className="text-lg font-bold text-gray-400 tracking-tight">@{username}</p>
              </div>
              <a 
                href={platform === 'instagram' ? `https://instagram.com/${username}` : 
                      platform === 'facebook' ? `https://facebook.com/${username}` :
                      platform === 'twitter' ? `https://twitter.com/${username}` :
                      platform === 'linkedin' ? `https://linkedin.com/in/${username}` :
                      platform === 'youtube' ? `https://youtube.com/@${username}` :
                      `https://tiktok.com/@${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-6 text-white rounded-[40px] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all ${config.color}`}
              >
                Go to Profile
                <ChevronRight className="w-6 h-6" />
              </a>
           </div>
         );

      case 'pdf':
         return (
           <div className="space-y-8">
              <div className="text-center">
                 <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100">
                    <FileText className="w-10 h-10" />
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 mb-2">Document View</h1>
                 <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Secure PDF Hosting</p>
              </div>
              <div className="bg-white border border-gray-100 p-6 rounded-3xl flex items-center gap-4">
                 <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{data.pdf?.name || 'document_file.pdf'}</p>
                    <p className="text-xs text-gray-400">PDF Document • 2.4 MB</p>
                 </div>
              </div>
              <button className="w-full py-5 bg-red-600 text-white rounded-[40px] font-black text-lg shadow-xl shadow-red-100 flex items-center justify-center gap-3">
                 <Download className="w-6 h-6" />
                 Download PDF
              </button>
           </div>
         );

      case 'video':
         return (
           <div className="space-y-8">
              <div className="relative w-full aspect-video bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-16 h-16 text-white opacity-20" />
                 </div>
                 {data.video?.url && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                       <p className="text-white font-bold text-sm truncate">{data.video.url}</p>
                    </div>
                 )}
              </div>
              <div className="text-center">
                 <h1 className="text-2xl font-bold text-gray-900 mb-2">Watch Video</h1>
                 <p className="text-gray-400 text-sm">Streaming services are currently playing.</p>
              </div>
              <a 
                href={data.video?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-5 bg-blue-600 text-white rounded-[40px] font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
              >
                 <ExternalLink className="w-6 h-6" />
                 Open Video
              </a>
           </div>
         );

      case 'mp3':
         return (
           <div className="space-y-8">
              <div className="text-center">
                 <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-100 animate-pulse">
                    <Music className="w-12 h-12" />
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 mb-2">Audio Player</h1>
                 <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Streaming MP3</p>
              </div>
              <div className="bg-gray-50 p-8 rounded-[40px] space-y-6">
                 <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-blue-600 rounded-full" />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">1:24</span>
                    <span className="text-xs font-bold text-gray-400">4:02</span>
                 </div>
              </div>
              <button className="w-full py-5 bg-slate-900 text-white rounded-[40px] font-black text-lg flex items-center justify-center gap-3">
                 <Music className="w-6 h-6" />
                 Play Audio
              </button>
           </div>
         );

      case 'app':
         return (
           <div className="space-y-10">
              <div className="text-center">
                 <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                    <ShoppingBag className="w-10 h-10" />
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 mb-2">Download App</h1>
                 <p className="text-gray-400 text-sm">Available on all your devices</p>
              </div>
              <div className="space-y-4">
                 <button className="w-full py-6 bg-black text-white rounded-[40px] font-bold flex items-center px-8 gap-4 shadow-xl">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.96.95-2.22 1.48-3.48 1.48s-2.52-.53-3.48-1.48c-.96-1-1.39-2.31-1.28-3.64.11-1.33.74-2.52 1.77-3.35 1.03-.84 2.37-1.18 3.65-1.14 1.28.05 2.44.47 3.24 1.18-.8.15-1.93.91-1.93 2.1 0 1.19.78 2.36 2.36 2.36.19 0 .37-.02.55-.06-.11.85-.5 1.63-1.14 2.24l-3.26.31zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                    <div className="text-left">
                       <p className="text-[10px] uppercase font-black opacity-60">App Store</p>
                       <p className="text-sm font-black">Download for iOS</p>
                    </div>
                 </button>
                 <button className="w-full py-6 bg-white border-2 border-gray-100 text-gray-900 rounded-[40px] font-bold flex items-center px-8 gap-4 shadow-sm">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.609 22.186c-.18.18-.285.424-.285.679 0 .528.432.96 1.011.96.183 0 .354-.051.5-.141l14.945-8.407c.54-.303.896-.879.896-1.528 0-.649-.356-1.225-.896-1.528L4.835.132c-.146-.09-.32-.141-.498-.141C3.758 0 3.326.432 3.326.96c0 .255.105.499.283.679l.001-.001-.001.176v.001z" /></svg>
                    <div className="text-left">
                       <p className="text-[10px] uppercase font-black opacity-60">Google Play</p>
                       <p className="text-sm font-black">Get it on Android</p>
                    </div>
                 </button>
              </div>
           </div>
         );

      case 'form':
        if (submitted) {
          return (
            <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-100">
                 <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-gray-900 mb-4">Thank You!</h1>
                 <p className="text-gray-500 font-medium px-4">Your response has been successfully submitted and saved.</p>
              </div>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
              >
                 Submit Another Response
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                   <ClipboardList className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.form?.title || 'Form'}</h1>
                {data.form?.description && (
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">{data.form.description}</p>
                )}
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                {data.form?.fields.sort((a, b) => a.order - b.order).map((field) => (
                  <div key={field.id} className="space-y-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 block">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                     </label>
                     
                     {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' ? (
                        <input 
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={answers[field.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-gray-900 font-bold transition-all shadow-inner"
                        />
                     ) : field.type === 'range' ? (
                        <div className="space-y-4 pt-2">
                           <input 
                             type="range"
                             min={field.validation?.min || 0}
                             max={field.validation?.max || 10}
                             step={field.validation?.step || 1}
                             value={answers[field.id] || field.validation?.min || 0}
                             onChange={(e) => setAnswers({ ...answers, [field.id]: parseInt(e.target.value) })}
                             className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                           />
                           <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                              <span>Min: {field.validation?.min || 0}</span>
                              <span className="text-blue-600 text-sm">Value: {answers[field.id] || field.validation?.min || 0}</span>
                              <span>Max: {field.validation?.max || 10}</span>
                           </div>
                        </div>
                     ) : field.type === 'checkbox' ? (
                        <div className="space-y-3">
                           {field.options && field.options.length > 0 ? (
                             <div className="grid grid-cols-1 gap-3">
                                {field.options.map((opt) => {
                                   const isChecked = Array.isArray(answers[field.id]) && answers[field.id].includes(opt.value);
                                   return (
                                     <label key={opt.value} className={cn(
                                       "flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border-2",
                                       isChecked ? "bg-blue-50/50 border-blue-600/20" : "bg-gray-50 border-transparent"
                                     )}>
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                             const current = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                                             const next = e.target.checked 
                                               ? [...current, opt.value]
                                               : current.filter((v: string) => v !== opt.value);
                                             setAnswers({ ...answers, [field.id]: next });
                                          }}
                                          className="w-5 h-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-600"
                                        />
                                        <span className={cn("text-sm font-bold transition-colors", isChecked ? "text-blue-900" : "text-gray-700")}>
                                          {opt.label}
                                        </span>
                                     </label>
                                   );
                                })}
                             </div>
                           ) : (
                             <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors border border-transparent">
                                <input 
                                  type="checkbox"
                                  checked={!!answers[field.id]}
                                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.checked })}
                                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-sm font-bold text-gray-700">{field.placeholder || 'Check this option'}</span>
                             </label>
                           )}
                        </div>
                     ) : field.type === 'select' ? (
                        <div className="relative">
                          <select 
                            required={field.required}
                            value={answers[field.id] || ''}
                            onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-gray-900 font-bold transition-all shadow-inner appearance-none"
                          >
                             <option value="" disabled>{field.placeholder || 'Select an option...'}</option>
                             {field.options?.map((opt) => (
                               <option key={opt.value} value={opt.value}>{opt.label}</option>
                             ))}
                          </select>
                          <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none rotate-90" />
                        </div>
                     ) : field.type === 'radio' ? (
                        <div className="space-y-3">
                           {field.options?.map((opt) => (
                             <label key={opt.value} className={cn(
                               "flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2",
                               answers[field.id] === opt.value ? "bg-blue-50 border-blue-600" : "bg-gray-50 border-transparent hover:bg-gray-100"
                             )}>
                                <input 
                                  type="radio"
                                  name={field.id}
                                  checked={answers[field.id] === opt.value}
                                  onChange={() => setAnswers({ ...answers, [field.id]: opt.value })}
                                  className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className={cn(
                                  "text-sm font-bold",
                                  answers[field.id] === opt.value ? "text-blue-900" : "text-gray-700"
                                )}>{opt.label}</span>
                             </label>
                           ))}
                        </div>
                     ) : null}
                     {field.helpText && <p className="text-[10px] font-bold text-gray-400 pl-1">{field.helpText}</p>}
                  </div>
                ))}

                <button 
                  type="submit"
                  disabled={submitMutation.isPending || isWizardPreview}
                  className="w-full py-5 bg-blue-600 text-white rounded-[32px] font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                   {submitMutation.isPending ? 'Submitting...' : 'Submit Response'}
                   {!submitMutation.isPending && <ChevronRight className="w-6 h-6" />}
                </button>
             </form>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-3xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dynamic Content</h1>
              <p className="text-gray-500 mt-2">The content for this QR code is ready.</p>
            </div>
            <pre className="text-left text-xs bg-gray-50 p-4 rounded-xl overflow-auto border border-gray-100 max-h-48 font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (isWizardPreview) {
    return (
      <div className="w-full flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar bg-white">
          <div className="flex items-center justify-center gap-2 mb-8 opacity-40">
            <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center">
                <ShieldCheck className="text-white w-3 h-3" />
            </div>
            <span className="text-[10px] font-bold text-gray-900 tracking-tight">QR Thrive</span>
          </div>
          {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-gray-50 p-8 sm:p-12 relative overflow-hidden">
        {/* Branding Header */}
        <div className="flex items-center justify-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
               <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">QR Thrive</span>
        </div>

        {renderContent()}

        {/* Footer info */}
        <div className="mt-16 text-center">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4">Powered by QR Thrive Enterprise</p>
            <div className="flex justify-center gap-6 opacity-30">
               <Globe className="w-4 h-4" />
               <ShieldCheck className="w-4 h-4" />
               <Smartphone className="w-4 h-4" />
            </div>
        </div>

        {/* Background Decals */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 -z-10" />
      </div>
    </div>
  );
};

const getSocialConfig = (platform: string) => {
  switch (platform) {
    case 'instagram': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>, 
      color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' 
    };
    case 'facebook': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, 
      color: 'bg-[#1877F2]' 
    };
    case 'twitter': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, 
      color: 'bg-black' 
    };
    case 'linkedin': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.37 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.729C24 .774 23.204 0 22.225 0z"/></svg>, 
      color: 'bg-[#0A66C2]' 
    };
    case 'youtube': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, 
      color: 'bg-[#FF0000]' 
    };
    case 'tiktok': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96s3.35-1.92 5.27-1.74c1.1.07 2.13.44 3.06 1.06V.02z"/></svg>, 
      color: 'bg-black' 
    };
    default: return { icon: Share2, color: 'bg-gray-600' };
  }
};



export default DynamicView;
