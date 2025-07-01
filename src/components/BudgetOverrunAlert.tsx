import { useLanguage } from '../context/LanguageContext';

export default function BudgetOverrunAlert({ message }: { message: string }) {
  const { t } = useLanguage();

  return (
    <div className="budget-alert">
      <strong>🚨 {t('budgetOverrunTitle') || 'Budget Overrun'}:</strong> {message}
    </div>
  );
}
