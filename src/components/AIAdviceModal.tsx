import { useAIAdvice } from '../hooks/useAIAdvice';
import '../styles/AIAdviceModal.css';
import thinkingGif from '../../public/thinking.gif'; 

export default function AIAdviceModal({
  budgets,
  transactions,
  onClose,
}: {
  budgets: any[];
  transactions: any[];
  onClose: () => void;
}) {
  const { advice, loading, getAdvice } = useAIAdvice();

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal">
        <button className="ai-close-btn" onClick={onClose}>×</button>
        <img src={thinkingGif} alt="Thinking..." className="ai-thinking-gif" />
        <h3>Hi there!   </h3>
        <h3>  I am your smart advisor. I am here to help you manage your finances</h3>
        <button
          onClick={() => getAdvice(budgets, transactions)}
          disabled={loading}
          className="ai-get-btn"
        >
          {loading ? 'Thinking...' : 'Get AI Advice'}
        </button>
        {advice && (
          <div className="ai-advice-box">
            {advice}
          </div>
        )}
      </div>
    </div>
  );
}
