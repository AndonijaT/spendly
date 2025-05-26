import { useState } from 'react';
import emailjs from '@emailjs/browser';
import '../styles/ContactPage.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

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
      <h2>Contact Us</h2>
      <form onSubmit={sendEmail} className="contact-form">
        <input type="text" name="name" placeholder="Name" required value={formData.name} onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} />
        <textarea name="message" placeholder="Message" required value={formData.message} onChange={handleChange} />
        <button type="submit">Send Email</button>
      </form>
      {success && <p className="contact-success"> Your message has been sent!</p>}
      {error && <p className="contact-error">Oops!Something went wrong.</p>}
    </div>
  );
}

export default Contact;
