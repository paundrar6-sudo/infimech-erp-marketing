import React, { useState, useEffect } from 'react';
import './IntroAnimation.css';

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
        {/* Top row: INFI + Logo (the logo IS the M, so no MECH text needed) */}
        <div className="intro-top-row">
          {/* Left word: INFI */}
          <AnimatedLetters text="INFI" baseDelay={1.3} className="intro-left-word" />

          {/* Center logo - actual INFIMECH logo (the M shape) */}
          <div className="intro-logo-wrap">
            <img 
              className="intro-whole" 
              src="/infimech-logo.png" 
              alt="INFIMECH Logo"
            />
            
            {/* Crack lines SVG overlay */}
            <svg className="intro-cracks" viewBox="0 0 52 52">
              <path d="M26 10 L24 18 L20 22" />
              <path d="M26 10 L29 16 L34 19" />
              <path d="M26 42 L28 36 L32 32" />
              <path d="M10 26 L18 24 L22 20" />
              <path d="M42 26 L36 28 L32 32" />
            </svg>
            
            <div className="intro-flash" />

            {/* Stem + MARKETING drop */}
            <div className="intro-stem" />
            <div className="intro-drop-wrap">
              <MarketingLetters text="MARKETING" baseDelay={3.0} />
            </div>
          </div>

          {/* No right word - logo itself represents the M/MECH */}
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
