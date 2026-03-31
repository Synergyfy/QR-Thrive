import { 
  Link, 
  Type, 
  Wifi, 
  Mail, 
  MessageSquare, 
  Phone, 
  Camera, 
  Globe, 
  Briefcase, 
  Play, 
  Music, 
  Bitcoin, 
  Calendar, 
  User,
  Zap
} from 'lucide-react';
import type { QRConfiguration, QRData, QRType } from '../../types/qr';

interface ContentPanelProps {
  config: QRConfiguration;
  updateData: (updates: Partial<QRData>) => void;
  updateConfig: (updates: Partial<QRConfiguration>) => void;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ContentPanel: React.FC<ContentPanelProps> = ({ config, updateData, updateConfig }) => {
  const data = config.data;
  const types: { type: QRType; icon: React.ReactNode; label: string; category: string }[] = [
    { type: 'url', icon: <Link className="w-4 h-4" />, label: 'Website Link', category: 'Basic' },
    { type: 'text', icon: <Type className="w-4 h-4" />, label: 'Plain Text', category: 'Basic' },
    { type: 'vcard', icon: <User className="w-4 h-4" />, label: 'Digital vCard', category: 'Personal' },
    { type: 'wifi', icon: <Wifi className="w-4 h-4" />, label: 'WiFi Access', category: 'Basic' },
    { type: 'email', icon: <Mail className="w-4 h-4" />, label: 'Email Draft', category: 'Basic' },
    { type: 'sms', icon: <MessageSquare className="w-4 h-4" />, label: 'SMS Message', category: 'Basic' },
    { type: 'whatsapp', icon: <Phone className="w-4 h-4" />, label: 'WhatsApp', category: 'Basic' },
    { type: 'instagram', icon: <Camera className="w-4 h-4" />, label: 'Instagram', category: 'Social' },
    { type: 'facebook', icon: <Globe className="w-4 h-4" />, label: 'Facebook', category: 'Social' },
    { type: 'linkedin', icon: <Briefcase className="w-4 h-4" />, label: 'LinkedIn', category: 'Social' },
    { type: 'twitter', icon: <MessageSquare className="w-4 h-4" />, label: 'Twitter', category: 'Social' },
    { type: 'youtube', icon: <Play className="w-4 h-4" />, label: 'YouTube', category: 'Social' },
    { type: 'tiktok', icon: <Music className="w-4 h-4" />, label: 'TikTok', category: 'Social' },
    { type: 'crypto', icon: <Bitcoin className="w-4 h-4" />, label: 'Crypto Pay', category: 'Specific' },
    { type: 'event', icon: <Calendar className="w-4 h-4" />, label: 'Event Info', category: 'Specific' },
  ];

  return (
    <div className="space-y-10">
      {/* Type Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {types.map((t) => (
          <button
            key={t.type}
            onClick={() => updateData({ type: t.type })}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-blue-50 text-left group min-h-[50px]",
              data.type === t.type
                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "border-gray-100 bg-white text-gray-500 hover:text-blue-600"
            )}
          >
            <div className={cn(
              "transition-colors",
              data.type === t.type ? "text-white" : "text-gray-400 group-hover:text-blue-600"
            )}>
              {t.icon}
            </div>
            <span className="text-[11px] font-bold leading-tight flex-1 break-words py-0.5">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-[0.2em]">Enter Content</h3>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Dynamic Mode</span>
              <button 
                onClick={() => updateConfig({ isDynamic: !config.isDynamic })}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative border",
                  config.isDynamic ? "bg-blue-600 border-blue-600" : "bg-gray-200 border-gray-200"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                  config.isDynamic ? "right-1" : "left-1"
                )} />
              </button>
           </div>
        </div>

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
            )}
           </div>
        </div>

        <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-3xl border border-blue-100">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Zap className="w-4 h-4 fill-yellow-300 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Expert Tip</p>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              {config.isDynamic 
                ? "Your QR code destination can be edited anytime. Ideal for marketing materials that are already printed!"
                : "Static codes encode data directly. For long-term use and tracking, we recommend enabling Dynamic Mode."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPanel;
