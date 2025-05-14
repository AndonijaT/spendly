// src/pages/Contact.tsx
import { useRef, useState } from 'react';
import { sendForm } from '@emailjs/browser';
import '../styles/ContactPage.css';

function Contact() {
    const form = useRef<HTMLFormElement | null>(null);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    const sendEmail = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.current) return;

        sendForm(
            'service_rmeoclc',       // Service ID
            'template_jxsrz5u',      // Template ID
            form.current!,           // Form reference
            '_lKKg5OBAAyxJzeYS'      // Public API Key
        )
            .then(
                () => {
                    setSuccess(true);
                    setError(false);
                    form.current?.reset();
                },
                () => {
                    setSuccess(false);
                    setError(true);
                }
            );
    };
console.log(form.current);
console.log('SERVICE:', import.meta.env.VITE_EMAILJS_SERVICE_ID);
console.log('TEMPLATE:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
console.log('PUBLIC KEY:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

    return (
        <div className="contact-container">
            <h2>Contact Us</h2>
            <p>Please use the form below to contact us. We’ll get back to you as soon as possible.</p>

            <form ref={form} onSubmit={sendEmail} className="contact-form">
                <input type="text" name="user_name" placeholder="Name" required />
                <input type="email" name="user_email" placeholder="Email" required />
                <textarea name="message" placeholder="Message" required />
                <button type="submit">Send Email</button>
            </form>

            {success && <p className="contact-success">✅ Message sent successfully!</p>}
            {error && <p className="contact-error">❌ Failed to send message. Please try again later.</p>}
        </div>
    );
}

export default Contact;
