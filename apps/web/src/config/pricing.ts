export type PriceTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface PlanConfig {
  name: string;
  price: number;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  popular?: boolean;
  trial?: boolean;
  limits?: {
    qrCodes: number;
    scans: number;
    leads?: number;
  };
}

export interface TierConfig {
  badge: string;
  title: string;
  subtitle: string;
  plans: PlanConfig[];
}

export interface PricingConfig {
  local: TierConfig;
  international: Record<PriceTier, TierConfig>;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  local: {
    badge: "For Nigerian Businesses",
    title: "Affordable tool to get more customers",
    subtitle: "Join thousands of businesses using QR codes to grow their customer base across Nigeria.",
    plans: [
      {
        name: "Free",
        price: 0,
        description: "Perfect for testing the waters.",
        features: ["2 Dynamic QR Codes", "50 Scans per month", "20 Leads per month", "Basic QR Types", "QRThrive Branding"],
        cta: "Start Free",
        limits: { qrCodes: 2, scans: 50, leads: 20 }
      },
      {
        name: "Pro",
        price: 3500,
        description: "Best for growing businesses.",
        features: ["10 Dynamic QR Codes", "Unlimited Scans", "Full Lead Access", "Advanced QR Types", "No Branding", "Priority Support"],
        cta: "Start 7-Day Free Trial",
        highlight: true,
        popular: true,
        trial: true,
        limits: { qrCodes: 10, scans: -1 }
      },
      {
        name: "Business",
        price: 8500,
        description: "Scale your marketing team.",
        features: ["Unlimited QR Codes", "Unlimited Scans/Leads", "Team Management (5)", "Dedicated Manager", "Priority Support"],
        cta: "Start 7-Day Free Trial",
        trial: true,
        limits: { qrCodes: -1, scans: -1 }
      }
    ]
  },
  international: {
    TIER_1: {
      badge: "High Income Region",
      title: "All-in-one QR marketing and lead capture",
      subtitle: "Track, capture, and convert your offline traffic into digital revenue with our complete ecosystem.",
      plans: [
        {
          name: "Free",
          price: 0,
          description: "Get started for free.",
          features: ["1 Dynamic QR Code", "50 Scans", "Basic QR Types", "QRThrive Branding"],
          cta: "Get Started",
          limits: { qrCodes: 1, scans: 50 }
        },
        {
          name: "Pro",
          price: 20,
          description: "Advanced marketing tools.",
          features: ["10 Dynamic QR Codes", "10,000 Scans /mo", "Full Customization", "Advanced QR Types", "Analytics Dashboard", "No Branding"],
          cta: "Start 7-Day PRO Trial",
          highlight: true,
          popular: true,
          trial: true,
          limits: { qrCodes: 10, scans: 10000 }
        },
        {
          name: "Business",
          price: 49,
          description: "The complete system.",
          features: ["Unlimited QR Codes", "Unlimited Scans", "Advanced Analytics", "Team Collaboration", "Priority Support"],
          cta: "Start 7-Day PRO Trial",
          trial: true,
          limits: { qrCodes: -1, scans: -1 }
        }
      ]
    },
    TIER_2: {
      badge: "Mid Income Region",
      title: "Powerful QR tools for your market",
      subtitle: "Professional QR generation and marketing tools optimized for your region's growth.",
      plans: [
        {
          name: "Free",
          price: 0,
          description: "Get started for free.",
          features: ["1 Dynamic QR Code", "50 Scans", "Basic QR Types", "QRThrive Branding"],
          cta: "Get Started",
          limits: { qrCodes: 1, scans: 50 }
        },
        {
          name: "Pro",
          price: 12,
          description: "Advanced marketing tools.",
          features: ["10 Dynamic QR Codes", "10,000 Scans /mo", "Full Customization", "Advanced QR Types", "Analytics Dashboard", "No Branding"],
          cta: "Start 7-Day PRO Trial",
          highlight: true,
          popular: true,
          trial: true,
          limits: { qrCodes: 10, scans: 10000 }
        },
        {
          name: "Business",
          price: 29,
          description: "The complete system.",
          features: ["Unlimited QR Codes", "Unlimited Scans", "Advanced Analytics", "Team Collaboration", "Priority Support"],
          cta: "Start 7-Day PRO Trial",
          trial: true,
          limits: { qrCodes: -1, scans: -1 }
        }
      ]
    },
    TIER_3: {
      badge: "Emerging Markets",
      title: "Affordable QR marketing for everyone",
      subtitle: "Grow your business with smart QR codes at the most competitive local pricing.",
      plans: [
        {
          name: "Free",
          price: 0,
          description: "Get started for free.",
          features: ["1 Dynamic QR Code", "50 Scans", "Basic QR Types", "QRThrive Branding"],
          cta: "Get Started",
          limits: { qrCodes: 1, scans: 50 }
        },
        {
          name: "Pro",
          price: 5,
          description: "Advanced marketing tools.",
          features: ["10 Dynamic QR Codes", "10,000 Scans /mo", "Full Customization", "Advanced QR Types", "Analytics Dashboard", "No Branding"],
          cta: "Start 7-Day PRO Trial",
          highlight: true,
          popular: true,
          trial: true,
          limits: { qrCodes: 10, scans: 10000 }
        },
        {
          name: "Business",
          price: 12,
          description: "The complete system.",
          features: ["Unlimited QR Codes", "Unlimited Scans", "Advanced Analytics", "Team Collaboration", "Priority Support"],
          cta: "Start 7-Day PRO Trial",
          trial: true,
          limits: { qrCodes: -1, scans: -1 }
        }
      ]
    }
  }
};

export const getPricingConfig = (): PricingConfig => {
  const saved = localStorage.getItem('qr_thrive_pricing_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_PRICING_CONFIG;
    }
  }
  return DEFAULT_PRICING_CONFIG;
};

export const savePricingConfig = (config: PricingConfig) => {
  localStorage.setItem('qr_thrive_pricing_config', JSON.stringify(config));
};
