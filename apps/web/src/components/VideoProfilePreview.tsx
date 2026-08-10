import React from 'react';
import { Play } from 'lucide-react';

interface VideoProfilePreviewProps {
  companyName?: string;
  title?: string;
  description?: string;
  footerText?: string;
  videoUrl?: string;
  themeColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonText?: string;
  onPlay: () => void;
  onButtonClick?: () => void;
}

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const VideoProfilePreview: React.FC<VideoProfilePreviewProps> = ({ 
  companyName = "Vemtap",
  title = "Digital Engagement Solutions",
  description = "We help businesses bring customers back. Instantly collect data with a simple tap and engage them automatically.",
  footerText = "From the preparation to the plate, learn to cook my favourite recipes",
  videoUrl,
  themeColor = "#5c7cfa",
  textColor = "#ffffff",
  buttonColor = "transparent",
  buttonTextColor = "#ffffff",
  buttonText = "View more",
  onPlay,
  onButtonClick
}) => {
  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const isDirectVideo = videoUrl && !youtubeId && /\.(mp4|mov|webm|ogg|avi)(\?|$)/i.test(videoUrl);

  return (
    <div className="w-full min-h-full flex flex-col font-sans overflow-y-auto scrollbar-hide" style={{ backgroundColor: themeColor }}>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-6 pt-12 pb-6 text-center" style={{ color: textColor }}>
          <p className="text-[11px] opacity-90 font-medium mb-1 tracking-wider">{companyName}</p>
          <h1 className="text-2xl font-bold mb-3">{title}</h1>
          <p className="text-[12px] opacity-80 leading-snug max-w-[280px] mx-auto mb-6">{description}</p>
          
          <button 
            onClick={onButtonClick}
            className="w-full py-4 rounded-xl font-semibold text-md border border-white/40 transition-colors"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            {buttonText}
          </button>
        </div>

        <div className="bg-white rounded-t-[32px] p-5 shadow-xl flex flex-col items-center min-h-[400px]">
          <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-6 flex items-center justify-center relative">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                title="Video"
                className="w-full h-full absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isDirectVideo ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              />
            ) : (
              <video
                src="/Vemtap Flyer QR Video.mp4"
                muted
                loop
                playsInline
                autoPlay
                className="w-full h-full object-cover"
                preload="metadata"
              />
            )}
          </div>

          <p className="text-sm text-gray-700 leading-relaxed text-center px-2">
            {footerText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoProfilePreview;
