import '../styles/ConfirmModal.css';

interface ConfirmModalProps {
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  successMode?: boolean;
}

export default function ConfirmModal({ message, onConfirm, onCancel, successMode = false }: ConfirmModalProps) {
  return (
    <div className="confirm-backdrop">
      <div className="confirm-modal">
        <p>{message}</p>
        <div className="confirm-buttons">
          {successMode ? (
            <button className="confirm-btn" onClick={onConfirm}>OK</button>
          ) : (
            <>
              <button className="cancel-btn" onClick={onCancel}>Cancel</button>
              <button className="confirm-btn" onClick={onConfirm}>Yes</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
