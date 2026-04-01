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
  Smartphone
} from 'lucide-react';
import type { QRConfiguration, QRData, QRType } from '../../types/qr';

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

const ContentPanel: React.FC<ContentPanelProps> = ({ config, updateData, hideTypeSelector }) => {
  const data = config.data;
  const types: { type: QRType; icon: React.ReactNode; label: string; category: string }[] = [
    { type: 'url', icon: <Link className="w-4 h-4" />, label: 'Website Link', category: 'Basic' },
    { type: 'text', icon: <Type className="w-4 h-4" />, label: 'Plain Text', category: 'Basic' },
    { type: 'vcard', icon: <User className="w-4 h-4" />, label: 'Digital vCard', category: 'Personal' },
    { type: 'wifi', icon: <Wifi className="w-4 h-4" />, label: 'WiFi Access', category: 'Basic' },
    { type: 'email', icon: <Mail className="w-4 h-4" />, label: 'Email Draft', category: 'Basic' },
    { type: 'sms', icon: <MessageSquare className="w-4 h-4" />, label: 'SMS Message', category: 'Basic' },
    { type: 'whatsapp', icon: <Phone className="w-4 h-4" />, label: 'WhatsApp', category: 'Social' },
    { type: 'image', icon: <Camera className="w-4 h-4" />, label: 'Images', category: 'Dynamic' },
    { type: 'socials', icon: <Share2 className="w-4 h-4" />, label: 'Multi Links', category: 'Social' },
    { type: 'pdf', icon: <FileText className="w-4 h-4" />, label: 'PDF Doc', category: 'Dynamic' },
    { type: 'video', icon: <Video className="w-4 h-4" />, label: 'Video', category: 'Dynamic' },
    { type: 'mp3', icon: <Music className="w-4 h-4" />, label: 'MP3 Audio', category: 'Dynamic' },
    { type: 'app', icon: <Smartphone className="w-4 h-4" />, label: 'App Store', category: 'Dynamic' },
    { type: 'crypto', icon: <Bitcoin className="w-4 h-4" />, label: 'Crypto Pay', category: 'Specific' },
    { type: 'event', icon: <Calendar className="w-4 h-4" />, label: 'Event Info', category: 'Dynamic' },
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

      <div className="animate-in fade-in slide-in-from-top-2 duration-500">

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
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp Number</p>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={data.whatsapp?.number || ''}
                      onChange={(e) => updateData({ whatsapp: { ...(data.whatsapp || { message: '' }), number: e.target.value } })}
                      placeholder="+1 234 567 890"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Message</p>
                  <textarea
                    value={data.whatsapp?.message || ''}
                    onChange={(e) => updateData({ whatsapp: { ...(data.whatsapp || { number: '' }), message: e.target.value } })}
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
                <div className="space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center space-y-4 hover:border-blue-400/50 transition-all relative overflow-hidden group text-center">
                    {data.image?.url ? (
                      <div className="relative w-full aspect-video flex items-center justify-center">
                         <img src={data.image.url} alt="Upload" className="max-h-[200px] rounded-xl shadow-lg border border-white" />
                         <button 
                          onClick={() => updateData({ image: undefined })}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                         >
                           <X className="w-3 h-3" />
                         </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <Camera className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900 leading-none mb-1">Upload Gallery Image</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">JPEG, PNG up to 2MB</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                               const reader = new FileReader();
                               reader.onload = (ev) => {
                                 updateData({ image: { url: ev.target?.result as string } } as any);
                               };
                               reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
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
                 </div>
              )}

              {(data.type === 'pdf' || data.type === 'mp3') && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-12 flex flex-col items-center justify-center space-y-4 transition-all relative overflow-hidden group">
                   <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 mb-2">
                       {data.type === 'pdf' ? <FileText className="w-8 h-8" /> : <Music className="w-8 h-8" />}
                   </div>
                   <div className="text-center space-y-1">
                      <h4 className="text-sm font-black text-gray-900 leading-none">Upload {data.type.toUpperCase()} File</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Click to browse or drag and drop</p>
                   </div>
                   <input type="file" accept={data.type === 'pdf' ? '.pdf' : 'audio/*'} className="absolute inset-0 opacity-0 cursor-pointer" />
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
    </div>
  );
};

export default ContentPanel;
