import React, { useEffect, useState } from 'react';
import { 
  Link, 
  Type, 
  Wifi, 
  Mail, 
  MessageSquare, 
  Phone, 
  Camera, 
  Globe, 
  Bitcoin, 
  Calendar, 
  User,
  Zap,
  Share2,
  X,
  FileText,
  Video,
  Music,
  Smartphone,
  ChevronDown,
  Loader2,
  Upload,
  Plus,
  ClipboardList,
  Building2,
  UtensilsCrossed,
  Ticket,
  Clock,
  MapPin,
  Palette,
  Users,
  Image as ImageIcon
} from 'lucide-react';
import type { QRConfiguration, QRData, QRType } from '../../types/qr';
import FormBuilder from '../FormBuilder';
import { countries } from '../../constants/countries';
import ImageEditor from '../ImageEditor';

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

interface ContentPanelProps {
  config: QRConfiguration;
  updateData: (updates: Partial<QRData>) => void;
  hideTypeSelector?: boolean;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CollapsibleSection = ({ id, title, subtitle, icon: Icon, children, className, isExpanded, onToggle }: { id: string, title: string, subtitle?: string, icon: any, children: React.ReactNode, className?: string, isExpanded: boolean, onToggle: (id: string) => void }) => {
  return (
    <div className={cn("border border-gray-100 rounded-[24px] overflow-hidden transition-all", isExpanded ? "shadow-sm" : "hover:bg-gray-50/50", className)}>
      <button 
        onClick={() => onToggle(id)}
        className="w-full p-4 bg-gray-50 flex items-center gap-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors text-left"
      >
        <Icon className="w-5 h-5 text-gray-500" />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          {subtitle && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{subtitle}</p>}
        </div>
        <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", isExpanded && "rotate-180")} />
      </button>
      <div className={cn("transition-all duration-300 ease-in-out overflow-hidden border-t border-gray-100/50", isExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0 invisible")}>
        <div className="p-6 bg-white space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ContentPanel: React.FC<ContentPanelProps> = ({ config, updateData, hideTypeSelector }) => {
  const data = config.data;
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'personal-identity': true,
    'basic-info': true,
    'business-details': true,
    'restaurant-details': true,
    'design': true,
    'coupon-details': true
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileSelect = (file: File, type: 'pdf' | 'mp3' | 'video') => {
    setUploading(type);
    try {
      const previewUrl = URL.createObjectURL(file);
      if (type === 'video') {
        updateData({ video: { url: previewUrl, pendingFile: { file } } });
      } else if (type === 'pdf') {
        updateData({ pdf: { url: previewUrl, name: file.name, size: file.size, pendingFile: { file } } as any });
      } else if (type === 'mp3') {
        updateData({ mp3: { url: previewUrl, name: file.name, size: file.size, pendingFile: { file } } as any});
      }
    } catch (err) {
      console.error('Failed to handle file:', err);
    } finally {
      setUploading(null);
    }
  };

  const handleMultipleImagesSelect = async (files: File[]) => {
    setUploading('image');
    try {
       const newImagesPromises = files.map(file => {
          return new Promise<any>((resolve) => {
             const reader = new FileReader();
             reader.onload = (ev) => {
                resolve({
                   url: ev.target?.result as string,
                   name: file.name,
                   size: file.size,
                   pendingFile: { file }
                });
             };
             reader.readAsDataURL(file);
          });
       });

       const newImages = await Promise.all(newImagesPromises);
       const currentImages = data.images || [];
       updateData({ images: [...currentImages, ...newImages.map(img => ({ ...img, id: Math.random().toString() }))] } as any);
    } catch (err) {
       console.error('Failed to handle multiple images:', err);
    } finally {
       setUploading(null);
    }
  };

  // Automatic Country Detection
  useEffect(() => {
    if (data.type === 'whatsapp' && !data.whatsapp?.phoneNumber && !data.whatsapp?.countryCode) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(geoData => {
          if (geoData.country_code) {
            const country = countries.find(c => c.code === geoData.country_code);
            if (country) {
              updateData({ 
                whatsapp: { 
                  ...(data.whatsapp || { message: '' }), 
                  countryCode: country.dialCode 
                } 
              });
            }
          }
        })
        .catch(() => {
          console.warn('Country detection failed');
        });
    }
  }, [data.type]);
  const types: { type: QRType; icon: React.ReactNode; label: string; category: string }[] = [
    { type: 'url', icon: <Link className="w-4 h-4" />, label: 'Website Link', category: 'Basic' },
    { type: 'text', icon: <Type className="w-4 h-4" />, label: 'Plain Text', category: 'Basic' },
    { type: 'vcard', icon: <User className="w-4 h-4" />, label: 'Digital vCard', category: 'Personal' },
    { type: 'wifi', icon: <Wifi className="w-4 h-4" />, label: 'WiFi Access', category: 'Basic' },
    { type: 'email', icon: <Mail className="w-4 h-4" />, label: 'Email Draft', category: 'Basic' },
    { type: 'sms', icon: <MessageSquare className="w-4 h-4" />, label: 'SMS Message', category: 'Basic' },
    { type: 'whatsapp', icon: <Phone className="w-4 h-4" />, label: 'WhatsApp', category: 'Social' },
    { type: 'image', icon: <Camera className="w-4 h-4" />, label: 'Images', category: 'Dynamic' },
    { type: 'links', icon: <Share2 className="w-4 h-4" />, label: 'Multi Links', category: 'Social' },
    { type: 'socials', icon: <Users className="w-4 h-4" />, label: 'Social Channels', category: 'Social' },
    { type: 'pdf', icon: <FileText className="w-4 h-4" />, label: 'PDF Doc', category: 'Dynamic' },
    { type: 'video', icon: <Video className="w-4 h-4" />, label: 'Video', category: 'Dynamic' },
    { type: 'mp3', icon: <Music className="w-4 h-4" />, label: 'MP3 Audio', category: 'Dynamic' },
    { type: 'app', icon: <Smartphone className="w-4 h-4" />, label: 'App Store', category: 'Dynamic' },
    { type: 'crypto', icon: <Bitcoin className="w-4 h-4" />, label: 'Crypto Pay', category: 'Specific' },
    { type: 'event', icon: <Calendar className="w-4 h-4" />, label: 'Event Info', category: 'Dynamic' },
    { type: 'form', icon: <ClipboardList className="w-4 h-4" />, label: 'Custom Form', category: 'Dynamic' },
    { type: 'business', icon: <Building2 className="w-4 h-4" />, label: 'Business Profile', category: 'Dynamic' },
    { type: 'menu', icon: <UtensilsCrossed className="w-4 h-4" />, label: 'Restaurant Menu', category: 'Dynamic' },
    { type: 'coupon', icon: <Ticket className="w-4 h-4" />, label: 'Coupon', category: 'Dynamic' },
  ];

  return (
    <div className="space-y-6">
      {!hideTypeSelector && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {types.map((t) => (
            <button
              key={t.type}
              onClick={() => updateData({ type: t.type })}
              className={cn(
                "flex items-center gap-2 px-3 py-3 rounded-2xl border transition-all hover:bg-blue-50 text-left group min-h-[56px]",
                data.type === t.type
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "border-gray-100 bg-white text-gray-500 hover:text-blue-600"
              )}
            >
              <div className={cn(
                "flex-shrink-0 transition-colors p-1.5 rounded-lg",
                data.type === t.type ? "bg-white/20 text-white" : "bg-gray-50 text-gray-400 group-hover:text-blue-600"
              )}>
                {t.icon}
              </div>
              <span className="text-[10px] font-extrabold leading-tight flex-1 whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">

        <div className="bg-white rounded-[24px] p-1 border border-gray-100 shadow-sm">
           <div className="p-6">
            {data.type === 'url' && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Website Address</p>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Globe className="w-5 h-5" />
                   </div>
                   <input
                    type="url"
                    value={data.url || ''}
                    onChange={(e) => updateData({ url: e.target.value })}
                    placeholder="https://your-website.com"
                    className={cn(
                      "w-full pl-12 pr-4 py-4 border-2 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30",
                      !data.url ? "border-amber-100/50" : "border-gray-50 focus:border-blue-600"
                    )}
                  />
                </div>
              </div>
            )}

            {data.type === 'text' && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Plain Text Content</p>
                <textarea
                  value={data.text || ''}
                  onChange={(e) => updateData({ text: e.target.value })}
                  placeholder="Enter the text you want to encode..."
                  rows={4}
                  className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                />
              </div>
            )}

            {data.type === 'vcard' && (
              <div className="space-y-6">
                <CollapsibleSection id="vcard-design" title="Colors & Styles" icon={Palette} isExpanded={expandedSections['vcard-design']} onToggle={toggleSection}>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Theme Color</p>
                      <div className="flex flex-wrap gap-2">
                        {['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669', '#0891b2', '#1e293b'].map(c => (
                          <button
                            key={c}
                            onClick={() => updateData({ vcard: { ...(data.vcard || {} as any), themeColor: c } } as any)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              (data.vcard as any)?.themeColor === c ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accent Color (Icons & Buttons)</p>
                      <div className="flex flex-wrap gap-2">
                        {['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669', '#0891b2', '#1e293b'].map(c => (
                          <button
                            key={c}
                            onClick={() => updateData({ vcard: { ...(data.vcard || {} as any), accentColor: c } } as any)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              (data.vcard as any)?.accentColor === c ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection 
                  id="vcard-personal" 
                  title="Personal Identity" 
                  icon={User}
                  isExpanded={expandedSections['vcard-personal']}
                  onToggle={toggleSection}
                >
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Profile Image</p>
                         <div className="flex items-center gap-4">
                             <label className="flex-1 px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                 <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                         const reader = new FileReader();
                                         reader.onloadend = () => {
                                             updateData({ vcard: { ...(data.vcard || {} as any), avatar: reader.result as string }});
                                         };
                                         reader.readAsDataURL(file);
                                     }
                                 }} />
                                 <Camera className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                 <span className="text-[11px] font-bold text-gray-400 group-hover:text-blue-500">Upload Photo</span>
                             </label>
                             {data.vcard?.avatar && (
                                 <div className="w-20 h-20 rounded-xl border border-gray-100 overflow-hidden relative group shrink-0 shadow-sm bg-white">
                                     <img src={data.vcard.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                                     <button 
                                       onClick={(e) => {
                                           e.preventDefault();
                                           updateData({ vcard: { ...(data.vcard || {} as any), avatar: undefined }});
                                       }}
                                       className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white backdrop-blur-sm transition-all"
                                     >
                                       <X className="w-5 h-5" />
                                     </button>
                                 </div>
                             )}
                         </div>
                      </div>

                      <div className="space-y-3">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Banner Image</p>
                         <div className="flex flex-col gap-3">
                             <label className="w-full px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                 <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                         const reader = new FileReader();
                                         reader.onloadend = () => {
                                             updateData({ vcard: { ...(data.vcard || {} as any), banner: reader.result as string }});
                                         };
                                         reader.readAsDataURL(file);
                                     }
                                 }} />
                                 <Camera className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                 <span className="text-[11px] font-bold text-gray-400 group-hover:text-blue-500">Upload Banner</span>
                             </label>
                             {data.vcard?.banner && (
                                 <div className="w-full aspect-[3/1] rounded-xl border border-gray-100 overflow-hidden relative group shadow-sm bg-white">
                                     <img src={data.vcard.banner} alt="Banner preview" className="w-full h-full object-cover" />
                                     <button 
                                       onClick={(e) => {
                                           e.preventDefault();
                                           updateData({ vcard: { ...(data.vcard || {} as any), banner: undefined }});
                                       }}
                                       className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white backdrop-blur-sm transition-all"
                                     >
                                       <X className="w-5 h-5" />
                                     </button>
                                 </div>
                             )}
                         </div>
                      </div>
                   </div>
                </CollapsibleSection>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">First Name</p>
                    <input
                      type="text"
                      value={data.vcard?.firstName || ''}
                      onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), firstName: e.target.value } })}
                      placeholder="John"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Name</p>
                    <input
                      type="text"
                      value={data.vcard?.lastName || ''}
                      onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), lastName: e.target.value } })}
                      placeholder="Doe"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                  <input
                    type="email"
                    value={data.vcard?.email || ''}
                    onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), email: e.target.value } })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                  <input
                    type="tel"
                    value={data.vcard?.mobile || ''}
                    onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), mobile: e.target.value } })}
                    placeholder="+1 234 567 890"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Website URL</p>
                  <input
                    type="url"
                    value={data.vcard?.website || ''}
                    onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), website: e.target.value } })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>

                <CollapsibleSection id="vcard-location" title="Location" icon={MapPin} isExpanded={expandedSections['vcard-location']} onToggle={toggleSection}>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</p>
                      <textarea
                        value={data.vcard?.address || ''}
                        onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), address: e.target.value } })}
                        placeholder="123 Example Street, City, Country"
                        rows={2}
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                      />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection id="vcard-company" title="Company Details" icon={Building2} isExpanded={expandedSections['vcard-company']} onToggle={toggleSection}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company</p>
                        <input
                          type="text"
                          value={data.vcard?.company || ''}
                          onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), company: e.target.value } })}
                          placeholder="Company Name"
                          className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Profession</p>
                        <input
                          type="text"
                          value={data.vcard?.jobTitle || ''}
                          onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), jobTitle: e.target.value } })}
                          placeholder="Job Title"
                          className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                        />
                      </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection id="vcard-summary" title="Summary" icon={ClipboardList} isExpanded={expandedSections['vcard-summary']} onToggle={toggleSection}>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">About You</p>
                      <textarea
                        value={data.vcard?.note || ''}
                        onChange={(e) => updateData({ vcard: { ...(data.vcard || {} as any), note: e.target.value } })}
                        placeholder="Tell people a bit about yourself..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                      />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection id="vcard-socials" title="Social Networks" icon={Share2} isExpanded={expandedSections['vcard-socials']} onToggle={toggleSection}>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { id: 'instagram' as const, icon: InstagramIcon, label: 'Instagram', placeholder: 'instagram.com/user' },
                        { id: 'facebook' as const, icon: FacebookIcon, label: 'Facebook', placeholder: 'facebook.com/user' },
                        { id: 'linkedin' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.729C24 .774 23.204 0 22.225 0z"/></svg>, label: 'LinkedIn', placeholder: 'linkedin.com/in/user' },
                        { id: 'twitter' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: 'Twitter', placeholder: 'twitter.com/user' },
                        { id: 'whatsapp' as const, icon: Phone, label: 'WhatsApp', placeholder: 'WhatsApp number' },
                      ].map((social) => (
                        <div key={social.id} className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600">
                            <social.icon className="w-full h-full" />
                          </div>
                          <input
                            type="text"
                            value={(data.vcard?.socials as any)?.[social.id] || ''}
                            onChange={(e) => updateData({ 
                              vcard: { 
                                ...(data.vcard || {}), 
                                socials: { 
                                  ...(data.vcard?.socials || {}), 
                                  [social.id]: e.target.value 
                                } 
                              } 
                            } as any)}
                            placeholder={social.placeholder}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-semibold bg-gray-50/30 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                </CollapsibleSection>
              </div>
            )}

            {data.type === 'wifi' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Network Name (SSID)</p>
                  <input
                    type="text"
                    value={data.wifi?.ssid || ''}
                    onChange={(e) => updateData({ wifi: { ...(data.wifi || { password: '', encryption: 'WPA' }), ssid: e.target.value } })}
                    placeholder="My Network"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</p>
                    <input
                      type="password"
                      value={data.wifi?.password || ''}
                      onChange={(e) => updateData({ wifi: { ...(data.wifi || { ssid: '', encryption: 'WPA' }), password: e.target.value } })}
                      placeholder="Network Password"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Encryption</p>
                    <select
                      value={data.wifi?.encryption || 'WPA'}
                      onChange={(e) => updateData({ wifi: { ...(data.wifi || { ssid: '', password: '' }), encryption: e.target.value as any } })}
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all appearance-none cursor-pointer"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {data.type === 'email' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipient Email</p>
                  <input
                    type="email"
                    value={data.email?.address || ''}
                    onChange={(e) => updateData({ email: { ...(data.email || { subject: '', body: '' }), address: e.target.value } })}
                    placeholder="example@mail.com"
                    className={cn(
                      "w-full px-4 py-3 border-2 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all",
                      !data.email?.address ? "border-amber-100/50" : "border-gray-50 focus:border-blue-600"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subject Line</p>
                  <input
                    type="text"
                    value={data.email?.subject || ''}
                    onChange={(e) => updateData({ email: { ...(data.email || { address: '', body: '' }), subject: e.target.value } })}
                    placeholder="Optional subject"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Message Body</p>
                  <textarea
                    value={data.email?.body || ''}
                    onChange={(e) => updateData({ email: { ...(data.email || { address: '', subject: '' }), body: e.target.value } })}
                    placeholder="Enter your email contents..."
                    rows={4}
                    className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
              </div>
            )}

            {data.type === 'sms' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={data.sms?.number || ''}
                      onChange={(e) => updateData({ sms: { ...(data.sms || { message: '' }), number: e.target.value } })}
                      placeholder="+1 234 567 890"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Predefined Message</p>
                  <textarea
                    value={data.sms?.message || ''}
                    onChange={(e) => updateData({ sms: { ...(data.sms || { number: '' }), message: e.target.value } })}
                    placeholder="Enter the message text..."
                    rows={4}
                    className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
              </div>
            )}

            {data.type === 'whatsapp' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Country Code</p>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                        <Globe className="w-4 h-4" />
                      </div>
                      <select 
                        value={data.whatsapp?.countryCode || '+1'}
                        onChange={(e) => updateData({ whatsapp: { ...(data.whatsapp || { message: '' }), countryCode: e.target.value } })}
                        className="w-full pl-11 pr-10 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30 appearance-none cursor-pointer"
                      >
                        {countries.map(c => (
                          <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                            {c.flag} {c.name} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={data.whatsapp?.phoneNumber || ''}
                        onChange={(e) => updateData({ whatsapp: { ...(data.whatsapp || { message: '' }), phoneNumber: e.target.value } })}
                        placeholder="234 567 890"
                        className="w-full pl-11 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Message</p>
                  <textarea
                    value={data.whatsapp?.message || ''}
                    onChange={(e) => updateData({ whatsapp: { ...(data.whatsapp || { countryCode: '+1', phoneNumber: '' }), message: e.target.value } })}
                    placeholder="Enter your auto-message..."
                    rows={4}
                    className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
              </div>
            )}

            {data.type === 'socials' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Social Profiles</p>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold">Dynamic Mode Recommended</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'instagram' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>, color: 'text-pink-600', placeholder: 'instagram.com/user' },
                    { id: 'facebook' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, color: 'text-blue-600', placeholder: 'facebook.com/user' },
                    { id: 'twitter' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, color: 'text-gray-900', placeholder: 'twitter.com/user' },
                    { id: 'linkedin' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.729C24 .774 23.204 0 22.225 0z"/></svg>, color: 'text-blue-700', placeholder: 'linkedin.com/in/user' },
                    { id: 'youtube' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, color: 'text-red-600', placeholder: 'youtube.com/@user' },
                    { id: 'tiktok' as const, icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96s3.35-1.92 5.27-1.74c1.1.07 2.13.44 3.06 1.06V.02z"/></svg>, color: 'text-black', placeholder: 'tiktok.com/@user' },
                  ].map((social) => (
                    <div key={social.id} className="relative group flex items-center gap-3">
                      <div className="flex-1 relative">
                        <div className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", social.color)}>
                          <social.icon className="w-full h-full" />
                        </div>
                        <input
                          type="text"
                          value={data.socials?.[social.id] || ''}
                          onChange={(e) => updateData({ 
                            socials: { 
                              ...(data.socials || {}), 
                              [social.id]: e.target.value 
                            } 
                          })}
                          placeholder={social.placeholder}
                          className="w-full pl-12 pr-10 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-semibold transition-all bg-gray-50/30"
                        />
                        {data.socials?.[social.id] && (
                          <button 
                            onClick={() => {
                              const newSocials = { ...(data.socials || {}) };
                              delete newSocials[social.id];
                              updateData({ socials: newSocials });
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200 hover:bg-gray-300 text-gray-500 rounded-lg transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'tiktok'].includes(data.type) && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{data.type} Profile</p>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors font-bold">@</div>
                  <input
                    type="text"
                    value={data.social?.username || ''}
                    onChange={(e) => updateData({ social: { platform: data.type as any, username: e.target.value } })}
                    placeholder="username"
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                  />
                </div>
              </div>
            )}

            {data.type === 'crypto' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Coin</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['bitcoin', 'ethereum', 'litecoin'].map(coin => (
                      <button
                        key={coin}
                        onClick={() => updateData({ crypto: { ...(data.crypto || { address: '' }), coin: coin as any } })}
                        className={cn(
                          "py-3 rounded-xl border-2 transition-all font-semibold text-xs capitalize",
                          data.crypto?.coin === coin ? "border-blue-600 bg-blue-600 text-white" : "border-gray-50 text-gray-500"
                        )}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wallet Address</p>
                  <input
                    type="text"
                    value={data.crypto?.address || ''}
                    onChange={(e) => updateData({ crypto: { ...(data.crypto || { coin: 'bitcoin' }), address: e.target.value } })}
                    placeholder="Paste your wallet address here"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                  />
                </div>
              </div>
            )}

            {data.type === 'event' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">What's the Event called?</p>
                    <input
                      type="text"
                      value={data.event?.title || ''}
                      onChange={(e) => updateData({ event: { ...(data.event || { location: '', startDate: '', endDate: '', description: '' }), title: e.target.value } })}
                      placeholder="Event Name"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Where is it happening?</p>
                    <input
                      type="text"
                      value={data.event?.location || ''}
                      onChange={(e) => updateData({ event: { ...(data.event || { title: '', startDate: '', endDate: '', description: '' }), location: e.target.value } })}
                      placeholder="City, Stadium, or Zoom Link"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                    />
                  </div>
                  </div>
                </div>
              )}

              {data.type === 'image' && (
                 <div className="space-y-6">
                    <CollapsibleSection id="image-design" title="Colors & Styles" icon={Palette} isExpanded={expandedSections['image-design']} onToggle={toggleSection}>
                        <div className="space-y-3">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background Color</p>
                           <div className="flex flex-wrap gap-2">
                             {['#166534', '#1e293b', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#059669', '#0891b2'].map(c => (
                               <button
                                 key={c}
                                 onClick={() => updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), themeColor: c } })}
                                 className={cn(
                                   "w-8 h-8 rounded-full border-2 transition-all",
                                   data.imageGalleryInfo?.themeColor === c ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                                 )}
                                 style={{ backgroundColor: c }}
                               />
                             ))}
                           </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection id="image-info" title="Gallery Information" icon={User} isExpanded={expandedSections['image-info']} onToggle={toggleSection}>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                               <div className="space-y-3">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Brand Logo</p>
                                  <div className="flex items-center gap-4">
                                      <label className="flex-1 px-4 py-4 border-2 border-dashed border-gray-100 rounded-xl hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                      updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), logoImage: { url: reader.result as string } }});
                                                  };
                                                  reader.readAsDataURL(file);
                                              }
                                          }} />
                                          <Camera className="w-5 h-5 text-gray-300 group-hover:text-blue-500 mb-1 transition-colors" />
                                          <span className="text-[10px] font-bold text-gray-300 group-hover:text-blue-500">Logo</span>
                                      </label>
                                      {data.imageGalleryInfo?.logoImage && (
                                          <div className="w-20 h-20 rounded-xl border border-gray-100 overflow-hidden relative group shrink-0 shadow-sm bg-white p-2">
                                              <img src={data.imageGalleryInfo.logoImage.url} alt="Logo" className="w-full h-full object-contain" />
                                              <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), logoImage: undefined }});
                                                }}
                                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white backdrop-blur-sm transition-all"
                                              >
                                                <X className="w-5 h-5" />
                                              </button>
                                          </div>
                                      )}
                                  </div>
                               </div>

                               <div className="space-y-3">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Hero Banner</p>
                                  <div className="flex flex-col gap-3">
                                      <label className="w-full px-4 py-4 border-2 border-dashed border-gray-100 rounded-xl hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                      updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), bannerImage: { url: reader.result as string } }});
                                                  };
                                                  reader.readAsDataURL(file);
                                              }
                                          }} />
                                          <Camera className="w-5 h-5 text-gray-300 group-hover:text-blue-500 mb-1 transition-colors" />
                                          <span className="text-[10px] font-bold text-gray-300 group-hover:text-blue-500">Upload Header</span>
                                      </label>
                                      {data.imageGalleryInfo?.bannerImage && (
                                          <div className="w-full aspect-[3/1] rounded-xl border border-gray-100 overflow-hidden relative group shadow-sm bg-white">
                                              <img src={data.imageGalleryInfo.bannerImage.url} alt="Banner" className="w-full h-full object-cover" />
                                              <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), bannerImage: undefined }});
                                                }}
                                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white backdrop-blur-sm transition-all"
                                              >
                                                <X className="w-5 h-5" />
                                              </button>
                                          </div>
                                      )}
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-3">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Gallery Title</p>
                               <input type="text" className="w-full px-4 py-3 border-2 border-slate-50 rounded-xl outline-none font-bold text-gray-900 bg-slate-50/50 text-sm focus:border-blue-600 transition-all" placeholder="e.g. Travel Photography" value={data.imageGalleryInfo?.title || ''} onChange={(e) => updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), title: e.target.value } })} />
                            </div>
                            <div className="space-y-3">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Description</p>
                               <textarea className="w-full px-4 py-3 border-2 border-slate-50 rounded-xl outline-none font-medium text-gray-900 bg-slate-50/50 text-sm focus:border-blue-600 transition-all" placeholder="Tell a story with your photos..." rows={3} value={data.imageGalleryInfo?.description || ''} onChange={(e) => updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), description: e.target.value } })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-3">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Button Text</p>
                                  <input type="text" className="w-full px-4 py-3 border-2 border-slate-50 rounded-xl outline-none font-bold text-gray-900 bg-slate-50/50 text-sm focus:border-blue-600 transition-all" placeholder="e.g. View More" value={data.imageGalleryInfo?.buttonText || ''} onChange={(e) => updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), buttonText: e.target.value } })} />
                               </div>
                               <div className="space-y-3">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Button URL</p>
                                  <input type="url" className="w-full px-4 py-3 border-2 border-slate-50 rounded-xl outline-none font-bold text-gray-900 bg-slate-50/50 text-sm focus:border-blue-600 transition-all" placeholder="https://..." value={data.imageGalleryInfo?.buttonUrl || ''} onChange={(e) => updateData({ imageGalleryInfo: { ...(data.imageGalleryInfo || {}), buttonUrl: e.target.value } })} />
                               </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection id="image-list" title="Gallery Photos" icon={ImageIcon} isExpanded={expandedSections['image-list']} onToggle={toggleSection}>
                       <div className="space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {(data.images || []).map((img, idx) => (
                              <div key={idx} className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group border-2 border-white shadow-sm hover:shadow-md transition-all">
                                <img 
                                  src={img.url} 
                                  alt={`Gallery ${idx}`} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                   <div className="flex gap-2">
                                      <button 
                                        onClick={() => {
                                          const newImages = [...(data.images || [])];
                                          newImages.splice(idx, 1);
                                          updateData({ images: newImages.length > 0 ? newImages : undefined } as any);
                                        }}
                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                   </div>
                                   <input 
                                     type="text" 
                                     placeholder="Add caption..."
                                     value={img.caption || ''}
                                     onClick={(e) => e.stopPropagation()}
                                     onChange={(e) => {
                                       const newImages = [...(data.images || [])];
                                       newImages[idx] = { ...newImages[idx], caption: e.target.value };
                                       updateData({ images: newImages });
                                     }}
                                     className="w-full text-[10px] bg-white/90 border-0 rounded-lg px-2 py-1 outline-none font-bold text-gray-900 shadow-lg"
                                   />
                                </div>
                              </div>
                            ))}
                            
                            <label className="relative aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all group">
                               <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                  <Plus className="w-5 h-5" />
                               </div>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Image</span>
                               <input 
                                 type="file" 
                                 accept="image/*"
                                 multiple
                                 className="hidden"
                                 onChange={(e) => {
                                   const files = Array.from(e.target.files || []);
                                   if (files.length > 0) {
                                     handleMultipleImagesSelect(files);
                                   }
                                 }}
                               />
                            </label>
                          </div>
                          
                          {(!data.images || data.images.length === 0) && (
                            <div className="text-center py-4">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Upload at least one image to your gallery</p>
                            </div>
                          )}
                       </div>
                    </CollapsibleSection>
                 </div>
              )}

              {data.type === 'video' && (
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Paste Video URL</p>
                    <div className="relative">
                       <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                        type="url"
                        value={data.video?.url || ''}
                        onChange={(e) => updateData({ video: { url: e.target.value } })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full pl-11 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all bg-gray-50/30"
                       />
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold italic translate-x-2">Supports YouTube, Vimeo, and direct links.</p>
                    
                    <div className="relative mt-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-100"></span>
                      </div>
                      <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                        <span className="bg-white px-4 text-gray-400">or upload</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 transition-all relative overflow-hidden group">
                      {uploading === 'video' ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-sm font-bold">Uploading...</span>
                        </div>
                      ) : data.video?.pendingFile ? (
                        <div className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-blue-100">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                 <Video className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                 <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                                    {data.video.pendingFile.file.name}
                                 </p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ready to upload</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => updateData({ video: undefined })}
                             className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                           >
                             <X className="w-5 h-5" />
                           </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600">
                            <Upload className="w-7 h-7" />
                          </div>
                          <div className="text-center">
                             <p className="text-sm font-bold text-gray-900">Upload Video File</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">MP4, MOV, WebM up to 50MB</p>
                          </div>
                          <input 
                            type="file" 
                            accept="video/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileSelect(file, 'video');
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                 </div>
              )}

              {(data.type === 'pdf' || data.type === 'mp3') && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-12 flex flex-col items-center justify-center space-y-4 transition-all relative overflow-hidden group">
                  {uploading === data.type ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm font-bold">Uploading...</span>
                    </div>
                  ) : (data.type === 'pdf' ? data.pdf?.pendingFile : data.mp3?.pendingFile) ? (
                     <div className="w-full flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-blue-100">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                              {data.type === 'pdf' ? <FileText className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                           </div>
                           <div className="text-left">
                              <p className="text-base font-bold text-gray-900 truncate max-w-[250px]">
                                 {data.type === 'pdf' ? data.pdf?.pendingFile?.file.name : data.mp3?.pendingFile?.file.name}
                              </p>
                              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Ready to upload</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => updateData({ [data.type]: undefined })}
                          className="p-3 hover:bg-red-50 text-red-500 rounded-2xl transition-all"
                        >
                          <X className="w-6 h-6" />
                        </button>
                     </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 mb-2">
                          {data.type === 'pdf' ? <FileText className="w-8 h-8" /> : <Music className="w-8 h-8" />}
                      </div>
                      <div className="text-center space-y-1">
                         <h4 className="text-sm font-black text-gray-900 leading-none">Upload {data.type.toUpperCase()} File</h4>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Click to browse or drag and drop</p>
                      </div>
                      <input 
                        type="file" 
                        accept={data.type === 'pdf' ? '.pdf' : 'audio/*'} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file, data.type as 'pdf' | 'mp3');
                          }
                        }}
                      />
                    </>
                  )}
                </div>
              )}

              {data.type === 'app' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Apple App Store URL</p>
                       <input 
                        type="url"
                        value={data.app?.ios || ''}
                        onChange={(e) => updateData({ app: { ...(data.app || {}), ios: e.target.value } })}
                        placeholder="apps.apple.com/..."
                        className="w-full px-6 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all bg-gray-50/30 shadow-inner"
                       />
                    </div>
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Google Play Store URL</p>
                       <input 
                        type="url"
                        value={data.app?.android || ''}
                        onChange={(e) => updateData({ app: { ...(data.app || {}), android: e.target.value } })}
                        placeholder="play.google.com/..."
                        className="w-full px-6 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all bg-gray-50/30 shadow-inner"
                       />
                    </div>
                 </div>
              )}

               {data.type === 'links' && (
                  <div className="space-y-6">
                     <CollapsibleSection id="links-design" title="Colors & Styles" icon={Palette} isExpanded={expandedSections['links-design']} onToggle={toggleSection}>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Background Color</p>
                              <div className="flex items-center gap-3">
                                 <input type="color" className="w-10 h-10 rounded-xl cursor-pointer" value={data.linksInfo?.themeColor || '#1E293B'} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), themeColor: e.target.value } })} />
                                 <input type="text" className="flex-1 px-4 py-2 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" value={data.linksInfo?.themeColor || '#1E293B'} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), themeColor: e.target.value } })} />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Link Background Color</p>
                              <div className="flex items-center gap-3">
                                 <input type="color" className="w-10 h-10 rounded-xl cursor-pointer" value={data.linksInfo?.linkBgColor || '#F7F7F7'} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), linkBgColor: e.target.value } })} />
                                 <input type="text" className="flex-1 px-4 py-2 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" value={data.linksInfo?.linkBgColor || '#F7F7F7'} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), linkBgColor: e.target.value } })} />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Link Text Color</p>
                              <div className="flex items-center gap-3">
                                 <input type="color" className="w-10 h-10 rounded-xl cursor-pointer" value={data.linksInfo?.linkTextColor || '#7EC09F'} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), linkTextColor: e.target.value } })} />
                                 <input type="text" className="flex-1 px-4 py-2 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" value={data.linksInfo?.linkTextColor || '#7EC09F'} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), linkTextColor: e.target.value } })} />
                              </div>
                           </div>
                        </div>
                    </CollapsibleSection>

                     <CollapsibleSection id="links-info" title="Basic Information" icon={User} isExpanded={expandedSections['links-info']} onToggle={toggleSection}>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Profile Image</p>
                              <div className="flex items-center gap-3">
                                 {data.linksInfo?.avatar ? (
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden relative group">
                                       <img src={data.linksInfo.avatar} alt="Profile" className="w-full h-full object-cover" />
                                       <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { updateData({ linksInfo: { ...(data.linksInfo || {}), avatar: undefined } }); }}>
                                          <X className="w-5 h-5 text-white" />
                                       </button>
                                    </div>
                                 ) : (
                                    <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all shrink-0">
                                       <Camera className="w-5 h-5 text-gray-400" />
                                       <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                             const reader = new FileReader();
                                             reader.onload = (ev) => {
                                                updateData({ linksInfo: { ...(data.linksInfo || {}), avatar: ev.target?.result as string } });
                                             };
                                             reader.readAsDataURL(file);
                                          }
                                       }} />
                                    </label>
                                 )}
                              </div>
                           </div>

                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Banner Image</p>
                              <div className="flex flex-col gap-3">
                                  <label className="w-full px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                  updateData({ linksInfo: { ...(data.linksInfo || {}), banner: reader.result as string }});
                                              };
                                              reader.readAsDataURL(file);
                                          }
                                      }} />
                                      <Camera className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                      <span className="text-[11px] font-bold text-gray-400 group-hover:text-blue-500">Upload Banner</span>
                                  </label>
                                  {data.linksInfo?.banner && (
                                      <div className="w-full aspect-[3/1] rounded-xl border border-gray-100 overflow-hidden relative group shadow-sm bg-white">
                                          <img src={data.linksInfo.banner} alt="Banner preview" className="w-full h-full object-cover" />
                                          <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateData({ linksInfo: { ...(data.linksInfo || {}), banner: undefined }});
                                            }}
                                            className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white backdrop-blur-sm transition-all"
                                          >
                                            <X className="w-5 h-5" />
                                          </button>
                                      </div>
                                  )}
                              </div>
                           </div>

                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Title *</p>
                              <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="E.g. Find me on social networks" value={data.linksInfo?.title || ''} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), title: e.target.value } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Description</p>
                              <textarea className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm" placeholder="E.g. New content every week in the links below" rows={3} value={data.linksInfo?.description || ''} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), description: e.target.value } })} />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-3">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Phone</p>
                                 <input type="tel" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="+1..." value={data.linksInfo?.phone || ''} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), phone: e.target.value } })} />
                              </div>
                              <div className="space-y-3">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Email</p>
                                 <input type="email" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="hello@me.com" value={data.linksInfo?.email || ''} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), email: e.target.value } })} />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Website URL</p>
                              <input type="url" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="https://..." value={data.linksInfo?.website || ''} onChange={(e) => updateData({ linksInfo: { ...(data.linksInfo || {}), website: e.target.value } })} />
                           </div>
                        </div>
                    </CollapsibleSection>

                     <CollapsibleSection id="links-list" title="List of Links" icon={Link} isExpanded={expandedSections['links-list']} onToggle={toggleSection}>
                       <div className="space-y-6">
                           {(data.linksList || []).map((link: any, idx: number) => (
                              <div key={link.id || idx} className="border border-gray-100 p-4 rounded-2xl relative bg-white shadow-sm overflow-hidden">
                                <button className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100" onClick={() => { const newList = [...(data.linksList || [])]; newList.splice(idx, 1); updateData({ linksList: newList }); }}><X className="w-4 h-4" /></button>
                                 <div className="space-y-4 pt-8">
                                   <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Link Image / Logo</p>
                                      <div className="flex items-center gap-3">
                                         {link.icon ? (
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden relative group">
                                               <img src={link.icon} alt="Link logo" className="w-full h-full object-cover" />
                                               <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const newList = [...(data.linksList || [])]; newList[idx].icon = undefined; updateData({ linksList: newList }); }}>
                                                  <X className="w-4 h-4 text-white" />
                                               </button>
                                            </div>
                                         ) : (
                                            <label className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all shrink-0">
                                               <Camera className="w-4 h-4 text-gray-400" />
                                               <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                     const reader = new FileReader();
                                                     reader.onload = (ev) => {
                                                        const newList = [...(data.linksList || [])];
                                                        newList[idx] = { ...newList[idx], icon: ev.target?.result as string };
                                                        updateData({ linksList: newList });
                                                     };
                                                     reader.readAsDataURL(file);
                                                  }
                                               }} />
                                            </label>
                                         )}
                                         <div className="flex-1 space-y-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Link text</p>
                                            <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-bold text-gray-900 transition-all bg-gray-50/30" placeholder="Name of the link" value={link.title || ''} onChange={(e) => { const newList = [...(data.linksList || [])]; newList[idx] = { ...newList[idx], title: e.target.value }; updateData({ linksList: newList }); }} />
                                         </div>
                                      </div>
                                   </div>
                                   <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">URL</p>
                                      <input type="url" className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-bold text-gray-900 transition-all bg-gray-50/30" placeholder="E.g. https://mywebsite.com/" value={link.url || ''} onChange={(e) => { const newList = [...(data.linksList || [])]; newList[idx] = { ...newList[idx], url: e.target.value }; updateData({ linksList: newList }); }} />
                                   </div>
                                </div>
                             </div>
                          ))}
                          <button 
                            onClick={() => updateData({ linksList: [...(data.linksList || []), { title: '', url: '', icon: '' }] })}
                            className="w-full py-4 bg-blue-50/50 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                          >
                             <Plus className="w-5 h-5" /> Add Link
                          </button>
                       </div>
                    </CollapsibleSection>
                 </div>
              )}

               {data.type === 'form' && (
                 <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Form Builder</p>
                          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Design your questions</h2>
                       </div>
                       <div className="px-4 py-2 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-xl">
                          Live Interactive
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Form Title</p>
                          <input 
                            type="text"
                            value={data.form?.title || ''}
                            onChange={(e) => updateData({ form: { ...(data.form || { fields: [], title: '' }), title: e.target.value } })}
                            placeholder="e.g. Feedback Form"
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description (Optional)</p>
                          <textarea 
                            value={data.form?.description || ''}
                            onChange={(e) => updateData({ form: { ...(data.form || { fields: [], title: '' }), description: e.target.value } })}
                            placeholder="Tell your audience what this form is about..."
                            rows={2}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all"
                          />
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                       <FormBuilder 
                        fields={data.form?.fields || []} 
                        onChange={(fields) => updateData({ form: { ...(data.form || { title: '' }), fields } })} 
                       />
                    </div>
                 </div>
               )}

              {data.type === 'business' && (
                <div className="space-y-6">
                   <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Theme Color</p>
                      <div className="flex flex-wrap gap-2">
                        {['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669', '#0891b2', '#1e293b'].map(c => (
                          <button
                            key={c}
                            onClick={() => updateData({ business: { ...(data.business || {} as any), themeColor: c } } as any)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              (data.business as any)?.themeColor === c ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accent Color (Icons & Buttons)</p>
                      <div className="flex flex-wrap gap-2">
                        {['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669', '#0891b2', '#1e293b'].map(c => (
                          <button
                            key={c}
                            onClick={() => updateData({ business: { ...(data.business || {} as any), accentColor: c } } as any)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              (data.business as any)?.accentColor === c ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                   </div>

                   <CollapsibleSection id="business-details" title="Business Details" icon={Building2} isExpanded={expandedSections['business-details']} onToggle={toggleSection}>
                       <div className="space-y-6">
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Business Logo</p>
                              <div className="flex items-center gap-4">
                                  <label className="flex-1 px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                  updateData({ business: { ...(data.business || {}), logo: reader.result as string }});
                                              };
                                              reader.readAsDataURL(file);
                                          }
                                      }} />
                                      <Camera className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                      <span className="text-[11px] font-bold text-gray-400 group-hover:text-blue-500">Upload Logo</span>
                                  </label>
                                  {data.business?.logo && (
                                      <div className="w-20 h-20 rounded-xl border border-gray-100 overflow-hidden relative group shrink-0 shadow-sm bg-white">
                                          <img src={data.business.logo} alt="Logo preview" className="w-full h-full object-cover" />
                                          <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateData({ business: { ...(data.business || {}), logo: undefined }});
                                            }}
                                            className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white backdrop-blur-sm transition-all"
                                          >
                                            <X className="w-5 h-5" />
                                          </button>
                                      </div>
                                  )}
                              </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Banner Image</p>
                              <div className="flex flex-col gap-3">
                                  <label className="w-full px-4 py-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                  updateData({ business: { ...(data.business || {}), banner: reader.result as string }});
                                              };
                                              reader.readAsDataURL(file);
                                          }
                                      }} />
                                      <Camera className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-1 transition-colors" />
                                      <span className="text-[11px] font-bold text-gray-400 group-hover:text-blue-500">Upload Banner</span>
                                  </label>
                                  {data.business?.banner && (
                                      <div className="w-full aspect-[2/1] rounded-xl border border-gray-100 overflow-hidden relative group shadow-sm bg-white">
                                          <img src={data.business.banner} alt="Banner preview" className="w-full h-full object-cover" />
                                          <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateData({ business: { ...(data.business || {}), banner: undefined }});
                                            }}
                                            className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white backdrop-blur-sm transition-all"
                                          >
                                            <X className="w-5 h-5" />
                                          </button>
                                      </div>
                                  )}
                              </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Company Name</p>
                              <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="Your Business Ltd." value={data.business?.companyName || ''} onChange={(e) => updateData({ business: { ...(data.business || {}), companyName: e.target.value } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Headline</p>
                              <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="e.g. Best Coffee in Town" value={data.business?.headline || ''} onChange={(e) => updateData({ business: { ...(data.business || {}), headline: e.target.value } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">About Us</p>
                              <textarea className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm" placeholder="Describe your business..." rows={3} value={data.business?.about || ''} onChange={(e) => updateData({ business: { ...(data.business || {}), about: e.target.value } })} />
                           </div>
                       </div>
                   </CollapsibleSection>
                   
                   <CollapsibleSection id="business-contact" title="Contact" icon={Phone} isExpanded={expandedSections['business-contact']} onToggle={toggleSection}>
                       <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Email</p>
                                <input type="email" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="hello@business.com" value={data.business?.contact?.email || ''} onChange={(e) => updateData({ business: { ...(data.business || {}), contact: { ...(data.business?.contact || {}), email: e.target.value } } })} />
                             </div>
                             <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Phone</p>
                                <input type="tel" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="+1..." value={data.business?.contact?.phone || ''} onChange={(e) => updateData({ business: { ...(data.business || {}), contact: { ...(data.business?.contact || {}), phone: e.target.value } } })} />
                             </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Website</p>
                              <input type="url" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="https://" value={data.business?.contact?.website || ''} onChange={(e) => updateData({ business: { ...(data.business || {}), contact: { ...(data.business?.contact || {}), website: e.target.value } } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Address</p>
                              <textarea className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm" placeholder="123 Example Street" rows={2} value={data.business?.contact?.address || ''} onChange={(e) => updateData({ business: { ...(data.business || {}), contact: { ...(data.business?.contact || {}), address: e.target.value } } })} />
                           </div>
                       </div>
                   </CollapsibleSection>

                   <CollapsibleSection id="business-hours" title="Opening Hours" icon={Clock} isExpanded={expandedSections['business-hours']} onToggle={toggleSection}>
                       <div className="space-y-4">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                              const dayData = (data.business?.openingHours as any)?.[day];
                              const isClosed = typeof dayData === 'object' ? !!dayData.isClosed : dayData === 'Closed';
                              const fromTime = typeof dayData === 'object' ? dayData.from : '';
                              const toTime = typeof dayData === 'object' ? dayData.to : '';

                              return (
                                  <div key={day} className="space-y-2">
                                      <div className="flex items-center justify-between">
                                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{day}</p>
                                         <button 
                                           onClick={() => {
                                               const currentHours = data.business?.openingHours || {};
                                               updateData({
                                                   business: {
                                                       ...(data.business || {}),
                                                       openingHours: {
                                                           ...currentHours,
                                                           [day]: { from: fromTime || '09:00', to: toTime || '17:00', isClosed: !isClosed }
                                                       }
                                                   }
                                               } as any);
                                           }}
                                           className={cn(
                                             "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                                             isClosed ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                           )}
                                         >
                                           {isClosed ? 'Closed' : 'Open'}
                                         </button>
                                      </div>
                                      
                                      {!isClosed && (
                                         <div className="flex items-center gap-2">
                                             <div className="flex-1">
                                                 <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 ml-1">From</p>
                                                 <input
                                                     type="time"
                                                     className="w-full px-3 py-2 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-xs focus:border-blue-500 transition-colors"
                                                     value={fromTime}
                                                     onChange={(e) => {
                                                         const currentHours = data.business?.openingHours || {};
                                                         updateData({
                                                             business: {
                                                                 ...(data.business || {}),
                                                                 openingHours: {
                                                                     ...currentHours,
                                                                     [day]: { from: e.target.value, to: toTime || '17:00', isClosed: false }
                                                                 }
                                                             }
                                                         } as any);
                                                     }}
                                                 />
                                             </div>
                                             <div className="flex-1">
                                                 <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 ml-1">To</p>
                                                 <input
                                                     type="time"
                                                     className="w-full px-3 py-2 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-xs focus:border-blue-500 transition-colors"
                                                     value={toTime}
                                                     onChange={(e) => {
                                                         const currentHours = data.business?.openingHours || {};
                                                         updateData({
                                                             business: {
                                                                 ...(data.business || {}),
                                                                 openingHours: {
                                                                     ...currentHours,
                                                                     [day]: { from: fromTime || '09:00', to: e.target.value, isClosed: false }
                                                                 }
                                                             }
                                                         } as any);
                                                     }}
                                                 />
                                             </div>
                                         </div>
                                      )}
                                  </div>
                              );
                          })}
                       </div>
                   </CollapsibleSection>
                </div>
              )}

              {data.type === 'menu' && (
                <div className="space-y-6">
                    <CollapsibleSection id="menu-design" title="Colors & Styles" icon={Palette} isExpanded={expandedSections['menu-design']} onToggle={toggleSection}>
                        <div className="space-y-3">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Theme Color</p>
                           <div className="flex flex-wrap gap-2">
                             {['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#059669', '#0891b2', '#1e293b'].map(c => (
                               <button
                                 key={c}
                                 onClick={() => updateData({ menu: { ...(data.menu || {} as any), themeColor: c } } as any)}
                                 className={cn(
                                   "w-8 h-8 rounded-full border-2 transition-all",
                                   (data.menu as any)?.themeColor === c ? "border-slate-900 scale-110 shadow-lg" : "border-transparent hover:scale-105"
                                 )}
                                 style={{ backgroundColor: c }}
                               />
                             ))}
                           </div>
                        </div>
                   </CollapsibleSection>

                    <CollapsibleSection id="menu-details" title="Restaurant Details" icon={UtensilsCrossed} isExpanded={expandedSections['menu-details']} onToggle={toggleSection}>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Restaurant Name</p>
                              <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="e.g. The Great Cafe" value={data.menu?.restaurantName || ''} onChange={(e) => updateData({ menu: { ...(data.menu || {}), restaurantName: e.target.value } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Description</p>
                              <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="e.g. Authentic Italian Cuisine" value={data.menu?.description || ''} onChange={(e) => updateData({ menu: { ...(data.menu || {}), description: e.target.value } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Currency</p>
                              <input type="text" className="w-24 px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="$" value={data.menu?.currency || ''} onChange={(e) => updateData({ menu: { ...(data.menu || {}), currency: e.target.value } })} />
                           </div>
                        </div>
                   </CollapsibleSection>

                    <CollapsibleSection id="menu-items" title="Menu Categories & Items" icon={ClipboardList} isExpanded={expandedSections['menu-items']} onToggle={toggleSection}>
                       <div className="space-y-6">
                         {(data.menu?.categories || []).map((cat, cIdx) => (
                            <div key={cIdx} className="border-2 border-gray-50 rounded-xl p-4 space-y-4">
                               <div className="flex items-center gap-2">
                                   <input type="text" className="flex-1 px-4 py-2 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 text-sm" placeholder="Category Name (e.g. Starters)" value={cat.name} onChange={(e) => {
                                       const newCategories = [...(data.menu?.categories || [])];
                                       newCategories[cIdx].name = e.target.value;
                                       updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                                   }} />
                                   <button onClick={() => {
                                       const newCategories = [...(data.menu?.categories || [])];
                                       newCategories.splice(cIdx, 1);
                                       updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                                   }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                      <X className="w-5 h-5" />
                                   </button>
                               </div>
                               
                               <div className="pl-4 border-l-2 border-gray-50 space-y-3">
                                  {cat.items.map((item, iIdx) => (
                                     <div key={iIdx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl relative">
                                        <button className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md" onClick={() => {
                                              const newCategories = [...(data.menu?.categories || [])];
                                              newCategories[cIdx].items.splice(iIdx, 1);
                                              updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                                        }}>
                                           <X className="w-4 h-4" />
                                        </button>
                                        <div className="flex gap-2 mr-6">
                                            <input type="text" placeholder="Item Name" className="flex-1 px-3 py-2 rounded-lg text-sm font-bold bg-white outline-none border border-transparent focus:border-blue-500" value={item.name} onChange={(e) => {
                                                const newCategories = [...(data.menu?.categories || [])];
                                                newCategories[cIdx].items[iIdx].name = e.target.value;
                                                updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                                            }} />
                                            <input type="number" placeholder="Price" className="w-24 px-3 py-2 rounded-lg text-sm font-bold bg-white outline-none border border-transparent focus:border-blue-500" value={item.price || ''} onChange={(e) => {
                                                const newCategories = [...(data.menu?.categories || [])];
                                                newCategories[cIdx].items[iIdx].price = parseFloat(e.target.value) || 0;
                                                updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                                            }} />
                                        </div>
                                        <input type="text" placeholder="Description (Optional)" className="w-full px-3 py-2 rounded-lg text-sm text-gray-600 bg-white outline-none border border-transparent focus:border-blue-500" value={item.description || ''} onChange={(e) => {
                                              const newCategories = [...(data.menu?.categories || [])];
                                              newCategories[cIdx].items[iIdx].description = e.target.value;
                                              updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                                        }} />
                                     </div>
                                  ))}
                                  <button onClick={() => {
                                      const newCategories = [...(data.menu?.categories || [])];
                                      newCategories[cIdx].items.push({ id: Math.random().toString(), name: '', price: 0 });
                                      updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                                  }} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline p-1">
                                     <Plus className="w-3 h-3" /> Add Item
                                  </button>
                               </div>
                            </div>
                         ))}
                         
                         <button onClick={() => {
                             const newCategories = [...(data.menu?.categories || []), { id: Math.random().toString(), name: '', items: [] }];
                             updateData({ menu: { ...(data.menu || {}), categories: newCategories }});
                         }} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                             <Plus className="w-4 h-4" /> Add Category
                         </button>
                       </div>
                   </CollapsibleSection>
                </div>
              )}

              {data.type === 'coupon' && (
                <div className="space-y-6">
                   <div className="border border-gray-100 rounded-[24px] overflow-hidden">
                       <div className="p-4 bg-gray-50 flex items-center gap-3 border-b border-gray-100">
                          <Ticket className="w-5 h-5 text-gray-500" />
                          <div className="flex-1">
                             <p className="text-sm font-bold text-gray-900">Coupon Details</p>
                          </div>
                       </div>
                       <div className="p-6 bg-white space-y-6">
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Coupon Title</p>
                              <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="e.g. 50% Off First Purchase" value={data.coupon?.title || ''} onChange={(e) => updateData({ coupon: { ...(data.coupon || {}), title: e.target.value } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Description</p>
                              <textarea className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm" placeholder="Describe the offer..." rows={2} value={data.coupon?.description || ''} onChange={(e) => updateData({ coupon: { ...(data.coupon || {}), description: e.target.value } })} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Discount</p>
                                <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="e.g. $10 OFF" value={data.coupon?.discount || ''} onChange={(e) => updateData({ coupon: { ...(data.coupon || {}), discount: e.target.value } })} />
                             </div>
                             <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Promo Code</p>
                                <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="e.g. SUMMER50" value={data.coupon?.promoCode || ''} onChange={(e) => updateData({ coupon: { ...(data.coupon || {}), promoCode: e.target.value } })} />
                             </div>
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Valid Until</p>
                              <input type="date" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" value={data.coupon?.validUntil || ''} onChange={(e) => updateData({ coupon: { ...(data.coupon || {}), validUntil: e.target.value } })} />
                           </div>
                           <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Company Name</p>
                              <input type="text" className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm" placeholder="Business Name" value={data.coupon?.companyName || ''} onChange={(e) => updateData({ coupon: { ...(data.coupon || {}), companyName: e.target.value } })} />
                           </div>
                       </div>
                   </div>
                </div>
              )}

            </div>
         </div>

         <div className="flex items-start gap-5 p-7 bg-blue-50 rounded-[32px] border border-blue-100/50">
          <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-100 shrink-0">
            <Zap className="w-5 h-5 fill-yellow-300 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-[0.2em] mb-1.5 opacity-60">Professional Tip</p>
            <p className="text-[13px] text-blue-900/80 font-bold leading-relaxed">
              {config.isDynamic 
                ? "This is a Dynamic QR Code. You can change its destination content at any time—even after printing—without changing the QR image itself."
                : "Static codes encode data directly. For long-term use, tracking, and the ability to edit content, we recommend using Dynamic Mode."}
            </p>
          </div>
        </div>
      </div>

      {editingImage && (
        <ImageEditor
          imageSrc={editingImage}
          onSave={(editedImage) => {
            updateData({ image: { url: editedImage } } as any);
            setEditingImage(null);
          }}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </div>
  );
};

export default ContentPanel;
