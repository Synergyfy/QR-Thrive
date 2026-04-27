import React from 'react';
import { Eye, Download } from 'lucide-react';

interface PDFProfilePreviewProps {
  companyName?: string;
  title?: string;
  description?: string;
  previewImage?: string;
  pdfUrl?: string;
  onView: () => void;
  themeColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

const PDFProfilePreview: React.FC<PDFProfilePreviewProps> = ({ 
  companyName = "Vemtap",
  title = "Digital Engagement Solutions",
  description = "We help businesses bring customers back. Instantly collect data with a simple tap and engage them automatically.",
  previewImage,
  pdfUrl,
  onView,
  themeColor = "#5c7cfa",
  textColor = "#ffffff",
  buttonColor = "#74b816",
  buttonTextColor = "#ffffff"
}) => {
  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden" style={{ backgroundColor: themeColor }}>
      {/* Hide scrollbar but keep scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Header Info - Compacted */}
        <div className="px-6 pt-10 pb-6 text-center" style={{ color: textColor }}>
          <p className="text-[11px] opacity-90 font-medium mb-1 tracking-wider uppercase">{companyName}</p>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-[12px] opacity-80 leading-snug max-w-[260px] mx-auto">{description}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-t-[32px] p-5 shadow-xl flex flex-col items-center">
          <div className="w-full aspect-[4/3] bg-orange-50 rounded-2xl overflow-hidden border border-orange-100 mb-6 flex items-center justify-center">
            {previewImage ? (
               <img src={previewImage} alt="PDF Preview" className="w-full h-full object-cover" />
            ) : (
               <div className="flex flex-col items-center gap-2">
                 <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                    <Eye className="w-6 h-6" />
                 </div>
                 <div className="text-sm font-bold text-orange-400">PDF Preview</div>
               </div>
            )}
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            <button 
              onClick={onView}
              className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-black/5"
              style={{ backgroundColor: buttonColor, color: buttonTextColor }}
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button 
              onClick={handleDownload}
              className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 bg-gray-900 text-white shadow-lg shadow-black/5"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFProfilePreview;
