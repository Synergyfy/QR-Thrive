import type { QRData } from '../types/qr';

export const DEMO_DATA: Record<string, Partial<QRData>> = {
  url: {
    type: 'url',
    url: 'https://qrthrive.com'
  },
  vcard: {
    type: 'vcard',
    vcard: {
      firstName: 'Miije',
      lastName: 'Kane',
      mobile: '+1 (555) 019-2834',
      email: 'hello@qrthrive.com',
      website: 'https://qrthrive.com',
      jobTitle: 'Head of Growth',
      company: 'QR Thrive',
      address: 'Lagos, Nigeria',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    }
  },
  business: {
    type: 'business',
    business: {
      companyName: 'QR Thrive',
      headline: 'Smart QR Codes That Drive Real Results',
      about: 'QR Thrive helps businesses create dynamic QR codes that bridge the gap between physical and digital. Collect customer data, drive engagement, and grow — all with a simple scan.',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop',
      banner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop',
      contact: {
        phone: '+1 (555) 019-2834',
        email: 'hello@qrthrive.com',
        website: 'https://qrthrive.com',
        address: 'Lagos, Nigeria'
      }
    }
  },
  socials: {
    type: 'socials',
    socials: {
      name: 'QR Thrive',
      bio: 'Smart QR codes for modern businesses. Create, track, and optimize your QR experiences. Follow us for tips, updates, and inspiration.',
      images: [
        { id: 'd1', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80' },
        { id: 'd2', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80' },
        { id: 'd3', url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=400&q=80' }
      ],
      instagram: 'https://instagram.com/qrthrive',
      facebook: 'https://facebook.com/qrthrive',
      twitter: 'https://twitter.com/qrthrive',
      linkedin: 'https://linkedin.com/company/qrthrive',
      youtube: 'https://youtube.com/@qrthrive',
      tiktok: 'https://tiktok.com/@qrthrive'
    }
  },
  links: {
    type: 'links',
    linksInfo: {
      title: 'QR Thrive — Everything in One Place',
      description: 'Explore QR Thrive. Your smart QR code platform for engagement, analytics, and growth.',
      themeColor: '#2563eb',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
    },
    linksList: [
      { title: 'Visit QR Thrive', url: 'https://qrthrive.com' },
      { title: 'View Pricing Plans', url: 'https://qrthrive.com/pricing' },
      { title: 'Read Our Blog', url: 'https://qrthrive.com/blog' }
    ]
  },
  wifi: {
    type: 'wifi',
    wifi: {
      ssid: 'QRThrive_Guest',
      password: 'welcome2qrthrive',
      encryption: 'WPA'
    }
  },
  text: {
    type: 'text',
    text: 'Welcome to QR Thrive — the smart QR code platform that helps businesses collect data, drive engagement, and boost growth. Scan to learn more at qrthrive.com'
  },
  whatsapp: {
    type: 'whatsapp',
    whatsapp: {
      phoneNumber: '15550192834',
      message: 'Hi! I just scanned your QR Thrive code and would like to learn more about your platform.'
    }
  },
  email: {
    type: 'email',
    email: {
      address: 'hello@qrthrive.com',
      subject: 'Interested in QR Thrive',
      body: 'Hi QR Thrive team, I scanned your QR code and would love to learn more about your platform and pricing.'
    }
  },
  phone: {
    type: 'phone',
    phone: {
      number: '+15550192834'
    }
  },
  sms: {
    type: 'sms',
    sms: {
      number: '+15550192834',
      message: 'Hi! I found your QR Thrive code and would like to get started. Please send me more info.'
    }
  },
  pdf: {
    type: 'pdf',
    pdf: {
      id: 'demo-pdf',
      name: 'QR_Thrive_Guide.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      companyName: 'QR Thrive',
      title: 'Getting Started with QR Thrive',
      description: 'A complete guide to creating, managing, and tracking your dynamic QR codes with QR Thrive.'
    }
  },
  video: {
    type: 'video',
    video: {
      id: 'demo-video',
      name: 'QR_Thrive_Demo.mp4',
      platform: 'other',
      companyName: 'QR Thrive',
      title: 'See QR Thrive in Action',
      description: 'Watch how QR Thrive helps businesses create smart QR codes that drive real engagement and growth.'
    }
  },
  image: {
    type: 'image',
    images: [
      { id: 'img1', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', name: 'Analytics Dashboard' },
      { id: 'img2', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', name: 'Marketing Growth' },
      { id: 'img3', url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop', name: 'Team Collaboration' }
    ]
  },
  mp3: {
    type: 'mp3',
    mp3: {
      id: 'demo-mp3',
      name: 'The Future of QR Technology',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      companyName: 'QR Thrive',
      title: 'How QR Codes Are Changing Business',
      description: 'Discover how QR Thrive is helping businesses bridge the physical-digital gap with smart, trackable QR codes.',
      themeColor: '#1e40af',
      textColor: '#ffffff',
      buttonColor: 'rgba(255,255,255,0.15)',
      buttonTextColor: '#ffffff'
    }
  },
  menu: {
    type: 'menu',
    menu: {
      restaurantName: 'QR Thrive Café',
      description: 'Scan. Order. Enjoy.',
      currency: '$',
      categories: [
        {
          id: '1',
          name: 'Digital Solutions',
          items: [
            { id: '1-1', name: 'Dynamic QR Codes', description: 'Unlimited edits, real-time analytics', price: 0 },
            { id: '1-2', name: 'QR Chaining', description: 'Connect multiple QR experiences together', price: 0 }
          ]
        },
        {
          id: '2',
          name: 'Growth Tools',
          items: [
            { id: '2-1', name: 'Engagement Tracking', description: 'See scans, locations, and device data', price: 0 },
            { id: '2-2', name: 'Custom Branding', description: 'Add your logo, colors, and frames', price: 0 }
          ]
        }
      ]
    }
  },
  coupon: {
    type: 'coupon',
    coupon: {
      title: 'Get 20% Off Your First QR Code',
      companyName: 'QR Thrive',
      discount: '20% OFF',
      description: 'Start building smart QR codes today. Use this coupon on your first paid plan.',
      promoCode: 'THRIVE20',
      validUntil: '2026-12-31'
    }
  },
  app: {
    type: 'app',
    app: {
      ios: 'https://apps.apple.com/app/qrthrive',
      android: 'https://play.google.com/store/apps/details?id=com.qrthrive'
    }
  },
  booking: {
    type: 'booking',
    booking: {
      businessName: 'QR Thrive',
      title: 'Free Strategy Consultation',
      description: 'Book a free 30-minute call with our team. We will help you choose the right QR strategy for your business and show you how QR Thrive works.',
      location: 'Online — Zoom / Google Meet',
      bookingUrl: 'https://calendly.com/qrthrive/demo',
      imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop',
      profileImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop',
      price: 'Free',
      duration: '30 Min',
      themeColor: '#2563eb',
      buttonText: 'Book Now',
      destinationMode: 'calendar'
    }
  }
};
