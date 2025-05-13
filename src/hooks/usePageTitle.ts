import { useEffect } from 'react';

const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `Spendly | ${title}`;
  }, [title]);
};

export default usePageTitle;
