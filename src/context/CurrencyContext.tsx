import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Currency = 'EUR' | 'USD';
const conversionRates: Record<Currency, number> = {
  EUR: 1,
  USD: 1.1,   // 1 EUR = 1.1 USD
};


const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convertToUserCurrency: (amount: number, from: Currency) => number;
  getSymbol: () => string;
}>({
  currency: 'EUR',
  setCurrency: () => {},
  convertToUserCurrency: () => 0,
  getSymbol: () => '€',
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
 const [currency, setCurrencyState] = useState<Currency>(() => {
  const saved = localStorage.getItem('currency') as Currency | null;
  return saved === 'USD' || saved === 'EUR' ? saved : 'EUR';
});


  const changeCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('currency', c);
  };

  const convertToUserCurrency = (amount: number, from: Currency) => {
    const baseInEur = amount / conversionRates[from];
    return baseInEur * conversionRates[currency];
  };

  const getSymbol = () => {
    if (currency === 'EUR') return '€';
    if (currency === 'USD') return '$';
    return '';
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: changeCurrency, convertToUserCurrency, getSymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}


export const useCurrency = () => useContext(CurrencyContext);
