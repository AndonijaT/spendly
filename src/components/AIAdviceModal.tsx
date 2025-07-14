import { useState } from 'react';
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
  const [chatStarted, setChatStarted] = useState(false);

  const handleGetAdvice = () => {
    setChatStarted(true);
    getAdvice(budgets, transactions);
  };

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal">
        <button className="ai-close-btn" onClick={onClose}>×</button>
        <img src={thinkingGif} alt="Thinking..." className="ai-thinking-gif" />
        <h3>Hi there!</h3>
        <h3>I am your smart advisor. I am here to help you manage your finances.</h3>

        {!chatStarted ? (
          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="ai-get-btn"
          >
            {loading ? 'Thinking...' : 'Get AI Advice'}
          </button>
        ) : (
          <div className="ai-chat-box">
            <div className="chat-message user">Advise me!</div>
            {loading ? (
              <div className="chat-message ai loading">Thinking... 🤖</div>
            ) : (
              advice && <div className="chat-message ai">{advice}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
