import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

function TypingIntro({ name }: { name: string }) {
  const { t } = useLanguage();

  const phrases = [
    `${t('hi') || 'Hi'} ${name || t('there') || 'there'}.`,
    t('niceToMeet') || 'Nice to meet you!',
  ];

  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;

    const currentPhrase = phrases[phraseIndex];
    const isLastPhrase = phraseIndex === phrases.length - 1;

    if (charIndex < currentPhrase.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + currentPhrase[charIndex]);
        setCharIndex(charIndex + 1);
      }, 80);
      return () => clearTimeout(timeout);
    } else {
      if (!isLastPhrase) {
        setTimeout(() => {
          setText('');
          setCharIndex(0);
          setPhraseIndex((prev) => prev + 1);
        }, 1000);
      } else {
        setDone(true);
        setTimeout(() => {
          document.getElementById('founder')?.scrollIntoView({ behavior: 'smooth' });
        }, 1200);
      }
    }
  }, [charIndex, phraseIndex, done, phrases]);

  return (
    <div className="typing-wrapper">
      <h1 className="typing-intro">
        {text}
        <span className="blinking-cursor">|</span>
      </h1>
    </div>
  );
}

export default TypingIntro;
