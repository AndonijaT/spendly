import { useState } from 'react';
import emailjs from '@emailjs/browser';
import '../styles/ContactPage.css';
import Footer from '../components/Footer'; 
import { useLanguage } from '../context/LanguageContext';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID!,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID!,
        {
          ...formData,
          title: 'Contact from React',
          time: new Date().toLocaleString(),
        }
      );
      setSuccess(true);
      setError(false);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Email failed to send:', err);
      setError(true);
      setSuccess(false);
    }
  };

 return (
  <div className="contact-container">
    <h2>{t('contactTitle') || 'Contact Us'}</h2>
    <p className="contact-intro">
      {t('contactIntro1') || 'Have a question? A bug to report?'}<br />
      {t('contactIntro2') || 'We’d love to hear from you. Just leave us a message below!'}
    </p>

    <form onSubmit={sendEmail} className="contact-form">
      <input
        type="text"
        name="name"
        placeholder={t('contactNamePlaceholder') || 'Your name'}
        required
        value={formData.name}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        placeholder={t('contactEmailPlaceholder') || 'Your email'}
        required
        value={formData.email}
        onChange={handleChange}
      />
      <textarea
        name="message"
        placeholder={t('contactMessagePlaceholder') || 'What’s on your mind?'}
        required
        value={formData.message}
        onChange={handleChange}
      />
      <button type="submit">{t('sendMessage') || 'Send Message'}</button>
    </form>

    {success && (
      <p className="contact-success">
        🎉 {t('contactSuccess') || 'Your message has been sent! We’ll get back to you soon.'}
      </p>
    )}
    {error && (
      <p className="contact-error">
        ⚠️ {t('contactError') || 'Oops! Something went wrong. Please try again later.'}
      </p>
    )}

    <p className="contact-closing">
      💛 {t('contactThanks') || 'Thanks for taking the time to connect with us. Your feedback helps make Spendly better!'}
    </p>

    <Footer />
  </div>
);
}
export default Contact;
