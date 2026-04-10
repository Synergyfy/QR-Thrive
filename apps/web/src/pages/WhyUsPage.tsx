import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { Target, Zap, Shield, BarChart, Globe, CheckCircle2 } from 'lucide-react';

export default function WhyUsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">QR Thrive?</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
              We're not just another QR code generator. We provide a complete physical-to-digital bridge for modern businesses, designed for scale and rich analytics.
            </p>
          </div>

          {/* Core Values / Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Lightning Fast Generation" 
              desc="Generate complex dynamic QR codes in milliseconds. Our optimized engine ensures no waiting, so you can build and export instantly." 
              color="bg-amber-100 text-amber-600"
            />
            <FeatureCard 
              icon={Target} 
              title="Dynamic Redirection" 
              desc="Update your QR code's destination URL anytime without reprinting. Fix typos or change promotional links on the fly." 
              color="bg-blue-100 text-blue-600"
            />
            <FeatureCard 
              icon={BarChart} 
              title="Rich Analytics" 
              desc="Track scan locations, device OS, and unique visitors. Gain actionable insights into how your campaigns are performing." 
              color="bg-emerald-100 text-emerald-600"
            />
            <FeatureCard 
              icon={Shield} 
              title="Enterprise Security" 
              desc="All links and data are encrypted natively. Stop worrying about malicious QR injections or data breaches." 
              color="bg-rose-100 text-rose-600"
            />
            <FeatureCard 
              icon={Globe} 
              title="Global Scale" 
              desc="Our serverless infrastructure ensures your dynamic QR codes load instantly regardless of where in the world they are scanned." 
              color="bg-indigo-100 text-indigo-600"
            />
            <FeatureCard 
              icon={CheckCircle2} 
              title="Custom Designs" 
              desc="Never settle for generic black-and-white cubes. Fully brand your QR codes with logos, custom patterns, and vibrant gradients." 
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {/* Call to Action */}
          <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center text-white relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-0 p-32 bg-blue-600/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 p-32 bg-indigo-600/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
            
            <h2 className="text-4xl font-black mb-6 relative z-10">Ready to transform your offline marketing?</h2>
            <p className="text-slate-300 max-w-2xl text-lg mb-10 relative z-10">
              Join thousands of businesses already using QR Thrive to connect the physical world with their digital experiences.
            </p>
            <a href="/" className="inline-block px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95 relative z-10">
              Start Building Now
            </a>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-300 group cursor-default">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 ${color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
