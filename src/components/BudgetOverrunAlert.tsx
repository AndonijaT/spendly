export default function BudgetOverrunAlert({ message }: { message: string }) {
  return (
    <div className="budget-alert">
      <strong>🚨 Budget Overrun:</strong> {message}
    </div>
  );
}
