import '../styles/ConfirmModal.css';
import { useLanguage } from '../context/LanguageContext';

interface ConfirmModalProps {
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  successMode?: boolean;
}

export default function ConfirmModal({ message, onConfirm, onCancel, successMode = false }: ConfirmModalProps) {
  const { t } = useLanguage();

  return (
    <div className="confirm-backdrop">
      <div className="confirm-modal">
        <p>{message}</p>
        <div className="confirm-buttons">
          {successMode ? (
            <button className="confirm-btn" onClick={onConfirm}>
              {t('ok') || 'OK'}
            </button>
          ) : (
            <>
              <button className="cancel-btn" onClick={onCancel}>
                {t('cancel') || 'Cancel'}
              </button>
              <button className="confirm-btn" onClick={onConfirm}>
                {t('yes') || 'Yes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
