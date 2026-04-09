import { useState, useEffect } from 'react';

export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP';

interface CurrencyData {
  code: CurrencyCode;
  symbol: string;
  rate: number; // vs NGN
}

const currencies: Record<CurrencyCode, CurrencyData> = {
  NGN: { code: 'NGN', symbol: '₦', rate: 1 },
  USD: { code: 'USD', symbol: '$', rate: 0.00067 }, // Roughly 1500 NGN = 1 USD
  EUR: { code: 'EUR', symbol: '€', rate: 0.00062 }, // Roughly 1600 NGN = 1 EUR
  GBP: { code: 'GBP', symbol: '£', rate: 0.00053 }, // Roughly 1900 NGN = 1 GBP
};

export type PriceTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type Market = 'local' | 'international';

const TIER_MAPPING: Record<string, PriceTier> = {
  // High-income (Tier 1)
  US: 'TIER_1', GB: 'TIER_1', CA: 'TIER_1', AU: 'TIER_1', DE: 'TIER_1', 
  FR: 'TIER_1', JP: 'TIER_1', SG: 'TIER_1', NL: 'TIER_1', SE: 'TIER_1', 
  CH: 'TIER_1', NO: 'TIER_1', IE: 'TIER_1', NZ: 'TIER_1',
  
  // Mid-income (Tier 2)
  AE: 'TIER_2', SA: 'TIER_2', BR: 'TIER_2', MX: 'TIER_2', ZA: 'TIER_2', 
  TR: 'TIER_2', AR: 'TIER_2', CL: 'TIER_2', KR: 'TIER_2', PL: 'TIER_2',
  
  // Low-income (Tier 3)
  NG: 'TIER_3', IN: 'TIER_3', PK: 'TIER_3', GH: 'TIER_3', KE: 'TIER_3', 
  ID: 'TIER_3', PH: 'TIER_3', VN: 'TIER_3', EG: 'TIER_3', BD: 'TIER_3'
};

export function useCurrency() {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyData>(currencies.NGN);
  const [market, setMarket] = useState<Market>('local');
  const [tier, setTier] = useState<PriceTier>('TIER_3');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        
        // Map country to Tier (fallback to TIER_1 for unknown global, TIER_3 for NG)
        const detectedTier = TIER_MAPPING[countryCode] || (countryCode ? 'TIER_1' : 'TIER_3');
        setTier(detectedTier);

        if (countryCode === 'NG') {
          setMarket('local');
          setSelectedCurrency(currencies.NGN);
        } else {
          setMarket('international');
          // Automatically pick best currency for international tiers
          if (['GB', 'UK'].includes(countryCode)) {
            setSelectedCurrency(currencies.GBP);
          } else if (['FR', 'DE', 'IT', 'ES', 'NL', 'IE', 'BE', 'AT', 'CH'].includes(countryCode)) {
            setSelectedCurrency(currencies.EUR);
          } else {
            setSelectedCurrency(currencies.USD);
          }
        }
      } catch (error) {
        console.error("Location detection failed", error);
        setSelectedCurrency(currencies.NGN);
        setMarket('local');
        setTier('TIER_3');
      } finally {
        setIsLoading(false);
      }
    }

    detectLocation();
  }, []);

  const convertPrice = (ngnAmount: string | number) => {
    const amount = typeof ngnAmount === 'string' ? parseFloat(ngnAmount.replace(/,/g, '')) : ngnAmount;
    const converted = amount * selectedCurrency.rate;
    
    // Formatting: NGN usually has no decimals if it's large, but USD/EUR/GBP always have 2
    if (selectedCurrency.code === 'NGN') {
      return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(converted);
    } else {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted);
    }
  };

  const setCurrency = (code: CurrencyCode) => {
    setSelectedCurrency(currencies[code]);
    setMarket(code === 'NGN' ? 'local' : 'international');
    
    // Adjust tier based on manual currency selection if needed (Simplified)
    if (code === 'NGN') setTier('TIER_3');
    else if (code === 'USD') setTier('TIER_1'); // Default USD to TIER_1 for simplicity in manual switch
  };

  return {
    currency: selectedCurrency,
    market,
    tier,
    convertPrice,
    setCurrency,
    isLoading,
    allCurrencies: Object.values(currencies)
  };
}
