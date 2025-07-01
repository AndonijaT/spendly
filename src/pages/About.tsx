import usePageTitle from '../hooks/usePageTitle';
import '../styles/About.css';
import TypingIntro from '../components/TypingIntro';
import { useAuth } from '../firebase/firebaseConfig'; 
import Footer from '../components/Footer'; 
import { useLanguage } from '../context/LanguageContext';

function About() {
  usePageTitle('About Spendly');
  const { user } = useAuth();
  const name = user?.displayName || 'there';
  const { t } = useLanguage();

  function scrollCarousel(direction: 'left' | 'right') {
    const container = document.getElementById('carousel');
    if (!container) return;
    const scrollAmount = container.clientWidth / 1.2;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

 function scrollToNextSection() {
  const sections = Array.from(document.querySelectorAll('section'));
  const offset = window.innerHeight * 0.1; 

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top > offset) {
      section.scrollIntoView({ behavior: 'smooth' });
      break;
    }
  }
}

  return (
    <div className="about-page">
      <section className="hero-banner">
        <TypingIntro name={name} />
        <div className="scroll-down">
          <button className="scroll-arrow" onClick={scrollToNextSection} aria-label="Scroll to next section">
            ↓
          </button>
        </div>
      </section>

      <br />

      <section id="founder" className="founder-section">
        <div className="founder-text">
          <h2>{t('about.andonijaIntro') || "I'm Andonija 👋"}</h2>
          <p>{t('about.intro1')}</p>
          <p>{t('about.intro2')}</p>
        </div>
        <div className="founder-image">
          <img src="/me.jpg" alt="Andonija Todorova" />
        </div>
      </section>
      <div className="scroll-down">
        <button className="scroll-arrow" onClick={scrollToNextSection}>↓</button>
      </div>

      <section id="mission" className="mission-wrapper">
        <div className="mission-container">
          <h2>{t('about.missionTitle')}</h2>
          <p>{t('about.mission1')}</p>
          <p>{t('about.mission2')}</p>
          <p>{t('about.mission3')}</p>
        </div>
      </section>
      <div className="scroll-down">
        <button className="scroll-arrow" onClick={scrollToNextSection}>↓</button>
      </div>

      <section className="free-marquee">
        <div className="marquee-track">
          <span>{t('about.banner')}</span>
          <span>{t('about.banner')}</span>
        </div>
      </section>
      <div className="scroll-down">
        <button className="scroll-arrow" onClick={scrollToNextSection}>↓</button>
      </div>

      <section id="values" className="values-carousel">
        <h2>{t('about.whySpendly')}</h2>
        <div className="carousel-wrapper">
          <button className="carousel-arrow left" onClick={() => scrollCarousel('left')}>←</button>
          <div className="carousel-track" id="carousel">
            <div className="carousel-item">
              ✨ <strong>{t('about.value1Title')}</strong><br />
              {t('about.value1Text')}
            </div>
            <div className="carousel-item">
              🔐 <strong>{t('about.value2Title')}</strong><br />
              {t('about.value2Text')}
            </div>
            <div className="carousel-item">
              🤝 <strong>{t('about.value3Title')}</strong><br />
              {t('about.value3Text')}
            </div>
            <div className="carousel-item">
              📊 <strong>{t('about.value4Title')}</strong><br />
              {t('about.value4Text')}
            </div>
            <div className="carousel-item">
              🤑 <strong>{t('about.value5Title')}</strong><br />
              {t('about.value5Text')}
            </div>
          </div>
          <button className="carousel-arrow right" onClick={() => scrollCarousel('right')}>→</button>
        </div>
      </section>

      {!user && (
        <>
          <div className="scroll-down">
            <button className="scroll-arrow" onClick={scrollToNextSection}>↓</button>
          </div>
          <section id="cta" className="cta-final">
            <h2>{t('about.ctaTitle')}</h2>
            <p>
              {t('about.ctaText')} <strong>{t('about.ctaStrong')}</strong>
            </p>
            <a className="cta-button" href="/signup">{t('about.ctaButton')}</a>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}

export default About;
