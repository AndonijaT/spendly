export default function FloatingNotificationButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        backgroundColor: '#d2b109',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        fontSize: '1.5rem',
        cursor: 'pointer',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 1000
      }}
    >
      🔔
    </button>
  );
}
