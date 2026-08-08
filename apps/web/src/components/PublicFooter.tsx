import { Link } from 'react-router-dom';
import { Globe, MessageSquare, Camera, Briefcase, type LucideIcon } from 'lucide-react';
import { useCurrentUser } from '../hooks/useApi';

function SocialIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <button className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white hover:-translate-y-0.5 transition-all">
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default function PublicFooter() {
  const { data: userData } = useCurrentUser();
  const user = userData?.user;

  return (
    <footer className="bg-slate-900 py-14 sm:py-20 px-4 text-slate-300 font-sans mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-10 mb-14">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/QRThrive_Logo_Full-BG.png" alt="QR Thrive" className="h-14 md:h-16 w-auto brightness-0 invert" />
            </div>
            <p className="text-slate-400 max-w-xs mb-8 leading-relaxed">Modernize your business interactions with the world's most intuitive QR management engine.</p>
            <div className="flex gap-3">
              <SocialIcon icon={Globe} />
              <SocialIcon icon={MessageSquare} />
              <SocialIcon icon={Camera} />
              <SocialIcon icon={Briefcase} />
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-white transition-colors">QR Generator</Link></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Dynamic Links</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Analytics Pro</a></li>
              <li><Link to={user ? "/dashboard?tab=pricing" : "/pricing"} className="text-slate-400 hover:text-white transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About Story</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Product Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Join Team</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Guard</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Usage Terms</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
          <p>© {(new Date()).getFullYear()} QR Thrive. Built for the future of physical interactions.</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <span className="hover:text-white cursor-pointer transition-colors">System Status</span>
            <span className="hover:text-white cursor-pointer transition-colors">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
