import PublicNav from '../components/PublicNav';
import PublicFooter from '../components/PublicFooter';
import { Building2, ShoppingBag, Utensils, GraduationCap, Plane, Stethoscope } from 'lucide-react';

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto space-y-24">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Solutions for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Every Industry</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
              Discover how QR Thrive enables transformation across top industries. Whether you're managing a storefront or a global supply chain, we have a solution for you.
            </p>
          </div>

          {/* Core Values / Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
            <SolutionCard 
              icon={ShoppingBag} 
              title="Retail & E-Commerce" 
              desc="Bridge the gap between your physical storefront and online store. Use QR codes for instant product reviews, digital warranties, and frictionless checkout." 
              color="bg-rose-100 text-rose-600"
            />
            <SolutionCard 
              icon={Utensils} 
              title="Restaurant & Hospitality" 
              desc="Replace physical menus with instantly updatable digital ones. Allow guests to order and pay directly from their table, streamlining the dining experience." 
              color="bg-amber-100 text-amber-600"
            />
            <SolutionCard 
              icon={Building2} 
              title="Real Estate" 
              desc="Place QR codes on 'For Sale' signs to provide potential buyers with instant 3D virtual tours, agent contact cards, and property specifications." 
              color="bg-blue-100 text-blue-600"
            />
            <SolutionCard 
              icon={GraduationCap} 
              title="Education" 
              desc="Enhance campus maps with digital wayfinding, enable quick student event check-ins, and securely share PDF course materials without printing." 
              color="bg-emerald-100 text-emerald-600"
            />
            <SolutionCard 
              icon={Plane} 
              title="Travel & Tourism" 
              desc="Give tourists instant access to dynamic, multi-lingual audio guides, city transit timetables, and digital boarding passes." 
              color="bg-indigo-100 text-indigo-600"
            />
            <SolutionCard 
              icon={Stethoscope} 
              title="Healthcare" 
              desc="Allow patients to securely check in via smartphone, access their digital health records securely, and view medication side-effect information." 
              color="bg-teal-100 text-teal-600"
            />
          </div>

          {/* Call to Action */}
          <div className="bg-white border border-slate-100 rounded-[3rem] p-12 lg:p-20 text-center shadow-2xl flex flex-col items-center">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Don't see your industry?</h2>
            <p className="text-slate-500 max-w-2xl text-lg mb-10 font-medium">
              QR Thrive is highly versatile. Our dynamic engines can be adapted to almost any offline-to-online use case. Let's discuss how we can help your business.
            </p>
            <a href="/" className="inline-block px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
              Contact Sales
            </a>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function SolutionCard({ icon: Icon, title, desc, color }: any) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 flex flex-col sm:flex-row gap-8 items-start cursor-default">
      <div className={`w-20 h-20 shrink-0 rounded-3xl flex items-center justify-center ${color}`}>
        <Icon className="w-10 h-10" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
        <p className="text-slate-500 leading-relaxed font-medium text-lg">{desc}</p>
      </div>
    </div>
  );
}
