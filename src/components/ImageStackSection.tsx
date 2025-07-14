import './../styles/ImageStackSection.css';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
export default function ImageStackSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="image-stack-section">
      <div className="text-side">
        <h2>💡 {t('spendSmarter')}</h2>
        <p>{t('discoverFeatures')}</p>
 <button className="cta-button" onClick={() => navigate('/features')}>
          {t('Features')}
        </button>      </div>
     <div className="image-stack">
  <img src="/Mockup (3).png" alt=" Phone Mockup Behind" className="img-stack back" />
  <img src="/Mockup (1).png" alt="Laptop Mockup " className="img-stack middle" />
  <img src="/Mockup (2).png" alt="Phone Mockup Front" className="img-stack front" />
</div>


    </div>
  );
}
