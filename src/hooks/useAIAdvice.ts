import { useState } from 'react';
import axios from 'axios';

export function useAIAdvice() {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAdvice = async (budgets: any[], transactions: any[]) => {
    setLoading(true);
    try {
      const res = await axios.post('https://us-central1-spendly-971fa.cloudfunctions.net/getAdvice', {
        budgets,
        transactions,
      });
      setAdvice(res.data.advice);
    } catch (err) {
      console.error(err);
      setAdvice(" AI assistant failed to respond.");
    }
    setLoading(false);
  };

  return { advice, loading, getAdvice };
}
