import { useState } from 'react';
import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { ChevronRight, HelpCircle } from 'lucide-react';


const FAQ_DATA = [
  { q: "How do I ensure my QR code is scannable?", a: "Just keep the contrast high (dark code, light background) and avoid overly complex designs. Using the 'Q' or 'H' error correction levels in the Design panel helps." },
  { q: "Can I change the QR code design after generation?", a: "Yes, you can modify any settings in the panel and the preview will update instantly." },
  { q: "Are these QR codes free to use?", a: "Yes, you can generate and export QR codes for personal and commercial use directly from this platform. For advanced tracking, upgrade to a professional plan." },
  { q: "What format should I download?", a: "PNG is great for digital use (social media/web), while SVG is recommended for print as it can be scaled to any size without losing quality." },
  { q: "What is a Dynamic QR Code?", a: "A dynamic QR code uses a short URL to redirect the user to the destination. This means you can change the destination URL at any time without having to reprint the QR code." },
  { q: "What happens if I downgrade my subscription?", a: "Your Dynamic QR codes will remain active, but you may lose access to advanced analytics, password protection, and custom domains based on your new plan." },
  { q: "Can I use my own domain name?", a: "Yes! On our Enterprise plans, you can map your own custom domain (e.g., qr.yourbrand.com) for a fully white-labeled experience." },
];

export default function FAQPage() {
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Header Section */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Find answers to the most common questions about QR Thrive, our features, and our platform.
            </p>
          </div>

          {/* FAQ List */}
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
            {FAQ_DATA.map((item, i) => (
              <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 hover:border-blue-100 transition-colors">
                <button
                  onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left font-bold text-slate-800 transition-colors focus:outline-none"
                >
                  <span className="text-lg">{item.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${faqOpenIndex === i ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                    <ChevronRight className={`w-5 h-5 transition-transform ${faqOpenIndex === i ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${faqOpenIndex === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 pt-0 border-t border-transparent text-slate-600 font-medium leading-relaxed">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
