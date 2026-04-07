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

export function useCurrency() {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyData>(currencies.NGN);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.country_code === 'US') {
          setSelectedCurrency(currencies.USD);
        } else if (['GB', 'UK'].includes(data.country_code)) {
          setSelectedCurrency(currencies.GBP);
        } else if (['FR', 'DE', 'IT', 'ES', 'NL'].includes(data.country_code)) {
          setSelectedCurrency(currencies.EUR);
        } else {
          setSelectedCurrency(currencies.NGN);
        }
      } catch (error) {
        console.error("Location detection failed", error);
        setSelectedCurrency(currencies.NGN);
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
  };

  return {
    currency: selectedCurrency,
    convertPrice,
    setCurrency,
    isLoading,
    allCurrencies: Object.values(currencies)
  };
}
