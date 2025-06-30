import usePageTitle from '../hooks/usePageTitle';
import '../styles/About.css';
import TypingIntro from '../components/TypingIntro';
import { useAuth } from '../firebase/firebaseConfig'; 
import Footer from '../components/Footer'; 

function About() {
  usePageTitle('About Spendly');
  const { user } = useAuth();
  const name = user?.displayName || 'there';
  function scrollCarousel(direction: 'left' | 'right') {
    const container = document.getElementById('carousel');
    if (!container) return;
    const scrollAmount = container.clientWidth / 1.2;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  return (
    <div className="about-page">
      { }
      <section className="hero-banner">
        <TypingIntro name={name} />
        <div className="scroll-down">
          <button
            className="scroll-arrow"
            onClick={() => {
              const target = document.getElementById('founder');
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            aria-label="Scroll to next section"
          >
            ↓
          </button>
        </div>
      </section>
      <br />


     
      <section id='founder' className="founder-section">
        <div className="founder-text">
          <h2>I'm Andonija 👋</h2>
          <p>
            I’m studying Information and Data Technologies at FERI Maribor, where I’ve been learning how to build useful, secure, and user-friendly web sites.
          </p>
          <p>
            Spendly started as a school project — now it's a platform that encourages mindful money habits. With clean visuals, easy manual entry, and optional AI features, Spendly helps you stay intentional with every expense.
          </p>
        </div>
        <div className="founder-image">
          <img src="\me.jpg" alt="Andonija Todorova" />
        </div>
      </section>


      {/* Mission Section */}
      <section id="mission" className="mission-wrapper">
        <div className="mission-container">
          <h2>Our mission</h2>
          <p>
            Spendly is your personal finance companion designed to make budgeting simple, collaborative, and actually enjoyable. Built for real people — not just financial experts — Spendly puts you back in control of your money through mindful tracking, smart visualizations, and shared financial goals.
          </p>
          <p>
            In a world where most budgeting apps bury core features behind subscriptions, bank logins, or bloated interfaces, Spendly takes a different path: one of transparency, clarity, and zero cost.
          </p>
          <p>
            Whether you're managing your own money, budgeting as a couple, or saving toward something big, Spendly offers a lightweight, distraction-free experience that adapts to your life — not the other way around.
          </p>
        </div>
      </section>


      <section className="free-marquee">
        <div className="marquee-track">
          <span>
            🎉 It’s FREE! No subscriptions. No limits. Just Spendly helping you stay in control of your money — because we care. 💛&nbsp;&nbsp;&nbsp;
          </span>
          <span>
            🎉 It’s FREE! No subscriptions. No limits. Just Spendly helping you stay in control of your money — because we care. 💛&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </section>


      <section id='values' className="values-carousel">
        <h2>Why Spendly</h2>
        <div className="carousel-wrapper">
          <button className="carousel-arrow left" onClick={() => scrollCarousel('left')}>←</button>

          <div className="carousel-track" id="carousel">
            <div className="carousel-item">✨ <strong>Simplicity</strong><br />Manual tracking, no complexity.</div>
            <div className="carousel-item">🔐 <strong>Privacy</strong><br />No bank connections, full control.</div>
            <div className="carousel-item">🤝 <strong>Transparency</strong><br />Built by a student, for everyone.</div>
            <div className="carousel-item">📊 <strong>Clarity</strong><br />Clean graphs and visuals that make sense.</div>
            <div className="carousel-item">🤑 <strong>Free</strong><br />No more extra money on subscriptions!</div>
          </div>

          <button className="carousel-arrow right" onClick={() => scrollCarousel('right')}>→</button>
        </div>
      </section>

{!user && (
  <section id="cta" className="cta-final">
    <h2> Join the Movement</h2>
    <p>Spendly gives you everything you need to master your budget — <strong>completely free</strong>.</p>
    <a className="cta-button" href="/signup">Create Your Free Account</a>
  </section>
)}

<Footer />
    
    </div>
    
  );
}

export default About;
