import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Currency = 'EUR' | 'USD' | 'MKD';

const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (c: Currency) => void;
}>({
  currency: 'EUR',
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('currency') as Currency) || 'EUR';
  });

  const changeCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem('currency', c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
