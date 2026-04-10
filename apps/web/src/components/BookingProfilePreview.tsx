import React, { useEffect, useRef } from 'react';
import { Calendar, Clock, MapPin, Tag, CreditCard, ArrowRight, ShieldCheck, Star } from 'lucide-react';

interface BookingProfilePreviewProps {
  businessName?: string;
  title?: string;
  description?: string;
  location?: string;
  bookingUrl?: string;
  imageUrl?: string;
  price?: string;
  duration?: string;
  themeColor?: string;
  buttonText?: string;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1544161515-4ae6b918af99?w=800&h=600&fit=crop";

const BookingProfilePreview: React.FC<BookingProfilePreviewProps> = ({
  businessName = "Premium Services",
  title = "Book Your Session",
  description = "Experience the best quality service tailored to your needs. Professional, reliable, and convenient.",
  location = "Main Street, NY",
  bookingUrl = "#",
  imageUrl,
  price,
  duration,
  themeColor = "#3b82f6",
  buttonText = "Book Now"
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col font-sans bg-slate-50 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b opacity-10 pointer-events-none" style={{ backgroundColor: themeColor }} />
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center z-10">
        
        {/* Cover Image Section */}
        <div className="w-full h-64 relative overflow-hidden bg-slate-200 shrink-0">
           <img 
            src={imageUrl || DEFAULT_IMAGE} 
            alt="Service" 
            className="w-full h-full object-cover relative z-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
            }}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
           
           {/* Wavy Divider */}
           <div className="absolute bottom-0 left-0 w-full leading-[0] z-20">
             <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-12 fill-slate-50">
               <path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
             </svg>
           </div>
           
           {/* Business Floating Badge */}
           <div className="absolute bottom-8 left-6 flex items-center gap-3 z-30">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2">
                 <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-900 font-black">
                    {businessName.charAt(0)}
                 </div>
              </div>
              <div className="text-white drop-shadow-lg">
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-90">Booking with</p>
                 <h4 className="text-sm font-black tracking-tight">{businessName}</h4>
              </div>
           </div>
        </div>

        {/* Content Section */}
        <div className="w-full bg-slate-50 px-6 pt-4 pb-20 space-y-8 relative">
           
           {/* Header Info */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="flex text-amber-500">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                 </div>
                 <span className="text-[10px] font-bold text-slate-400">Verified Professional</span>
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
              
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                {description}
              </p>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-2 gap-4">
              {price && (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <CreditCard size={18} />
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Price</p>
                      <p className="text-xs font-bold text-slate-900">{price}</p>
                   </div>
                </div>
              )}
              {duration && (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Clock size={18} />
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Duration</p>
                      <p className="text-xs font-bold text-slate-900">{duration}</p>
                   </div>
                </div>
              )}
           </div>

           {/* Details Section */}
           <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4 p-4 bg-slate-100/50 rounded-3xl border border-slate-100">
                 <div className="w-8 h-8 bg-white text-slate-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <MapPin size={16} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Location</p>
                    <p className="text-[11px] font-semibold text-slate-700">{location}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-3xl border border-emerald-50">
                 <div className="w-8 h-8 bg-white text-emerald-500 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <ShieldCheck size={16} />
                 </div>
                 <p className="text-[10px] font-bold text-emerald-700">
                    Your appointment is secured via QR Thrive verified business link.
                 </p>
              </div>
           </div>
        </div>
      </div>
      
      {/* CTA Footer */}
      <div className="p-6 bg-white border-t border-slate-100 rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-20">
         <a 
           href={bookingUrl} 
           target="_blank" 
           rel="noopener noreferrer"
           className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
           style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}40` }}
         >
            {buttonText}
            <ArrowRight size={18} />
         </a>
      </div>
    </div>
  );
};

export default BookingProfilePreview;
