import React, { useState, useEffect } from 'react';
import './IntroAnimation.css';

// Inline SVG logo placeholder (gear/cog icon matching INFIMECH branding)
const LogoSVG = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="32" cy="32" r="28" stroke="#7C93F5" strokeWidth="2" fill="rgba(72,102,213,0.15)" />
    <circle cx="32" cy="32" r="18" stroke="#5EEAD4" strokeWidth="1.5" fill="none" />
    <path d="M32 14L35 20H29L32 14Z" fill="#5EEAD4" />
    <path d="M32 50L29 44H35L32 50Z" fill="#5EEAD4" />
    <path d="M14 32L20 29V35L14 32Z" fill="#5EEAD4" />
    <path d="M50 32L44 35V29L50 32Z" fill="#5EEAD4" />
    <path d="M19 19L24 22L21 25L19 19Z" fill="#7C93F5" />
    <path d="M45 45L40 42L43 39L45 45Z" fill="#7C93F5" />
    <path d="M45 19L43 25L40 22L45 19Z" fill="#7C93F5" />
    <path d="M19 45L21 39L24 42L19 45Z" fill="#7C93F5" />
    <circle cx="32" cy="32" r="8" fill="#4866D5" />
    <circle cx="32" cy="32" r="4" fill="#5EEAD4" />
  </svg>
);

// Crack lines SVG overlay
const CracksSVG = () => (
  <svg className="intro-cracks" viewBox="0 0 52 52">
    <path d="M26 10 L24 18 L20 22" />
    <path d="M26 10 L29 16 L34 19" />
    <path d="M26 42 L28 36 L32 32" />
    <path d="M10 26 L18 24 L22 20" />
    <path d="M42 26 L36 28 L32 32" />
  </svg>
);

// Helper: render each letter with staggered animation delay
function AnimatedLetters({ text, baseDelay, className }) {
  return (
    <div className={`intro-word ${className}`}>
      {text.split('').map((char, i) => (
        <span key={i} style={{ animationDelay: `${baseDelay + i * 0.06}s` }}>
          {char}
        </span>
      ))}
    </div>
  );
}

function MarketingLetters({ text, baseDelay }) {
  return (
    <div className="intro-market-word">
      {text.split('').map((char, i) => (
        <span key={i} style={{ animationDelay: `${baseDelay + i * 0.04}s` }}>
          {char}
        </span>
      ))}
    </div>
  );
}

export default function IntroAnimation({ onComplete }) {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Start fading out at 4.9s
    const fadeTimer = setTimeout(() => {
      setHidden(true);
    }, 4900);

    // Fully remove from DOM at 5.7s (after fade completes)
    const removeTimer = setTimeout(() => {
      setRemoved(true);
      if (onComplete) onComplete();
    }, 5700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (removed) return null;

  return (
    <div className={`intro-overlay ${hidden ? 'intro-hidden' : ''}`}>
      <div className="intro-stage">
        {/* Top row: INFI + Logo + MECH */}
        <div className="intro-top-row">
          {/* Left word: INFI */}
          <AnimatedLetters text="INFI" baseDelay={1.3} className="intro-left-word" />

          {/* Center logo */}
          <div className="intro-logo-wrap">
            <div className="intro-whole">
              <LogoSVG />
            </div>
            <CracksSVG />
            <div className="intro-flash" />

            {/* Stem + MARKETING drop */}
            <div className="intro-stem" />
            <div className="intro-drop-wrap">
              <MarketingLetters text="MARKETING" baseDelay={3.0} />
            </div>
          </div>

          {/* Right word: MECH */}
          <AnimatedLetters text="MECH" baseDelay={1.55} className="intro-right-word" />
        </div>

        {/* Sub row: underline + tagline */}
        <div className="intro-sub-row">
          <div className="intro-underline" />
          <div className="intro-tagline">Integrated Marketing Resource Planning</div>
        </div>
      </div>
    </div>
  );
}
