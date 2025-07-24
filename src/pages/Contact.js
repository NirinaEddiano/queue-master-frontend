import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone,  faTicketAlt, faSignInAlt, faUserPlus, faBars } from '@fortawesome/free-solid-svg-icons';
import './Contact.css';

const Contact = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleScroll = () => {
      document.querySelectorAll('[data-scroll]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100 && rect.bottom > 100;
        if (isVisible) el.classList.add('visible');
      });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="contact-wrapper">
      <header className="contact-header">
        <div className="contact-container contact-header-content">
          <h1><FontAwesomeIcon icon={faTicketAlt} className="mr-2" /> QueueMaster</h1>
          <nav className={isMenuOpen ? 'contact-nav contact-nav-active' : 'contact-nav'}>
            <Link to="/" className={location.pathname === '/' ? 'contact-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            <Link to="/pourquoi-queuemaster" className={location.pathname === '/pourquoi-queuemaster' ? 'contact-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>QueueMaster</Link>
            <Link to="/nos-partenaires" className={location.pathname === '/nos-partenaires' ? 'contact-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>Partenaires</Link>
            <Link to="/faq" className={location.pathname === '/faq' ? 'contact-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>FAQ</Link>
            <Link to="/contact" className={location.pathname === '/contact' ? 'contact-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>Contact</Link>
            <button onClick={() => navigate('/login')} className="contact-adjusted-secondary-button" aria-label="Se connecter à QueueMaster"><FontAwesomeIcon icon={faSignInAlt} className="mr-2" /> Connexion</button>
            <button onClick={() => navigate('/signup')} className="contact-cta-button" aria-label="S'inscrire à QueueMaster"><FontAwesomeIcon icon={faUserPlus} className="mr-2" /> S'inscrire</button>
          </nav>
          <FontAwesomeIcon icon={faBars} className="contact-menu-toggle" onClick={toggleMenu} />
        </div>
      </header>
      <main>
        <section className="contact-hero" data-scroll="slide-up">
          <div className="contact-container">
            <h2 className="contact-title">Contactez-nous</h2>
            <p className="contact-subtitle">Nous sommes là pour vous aider. Contactez notre équipe pour toute question ou assistance.</p>
          </div>
        </section>
        <section className="contact-details" data-scroll="fade">
          <div className="contact-container">
            <div className="contact-card">
              <p className="contact-text">Pour toute question ou assistance, contactez-nous via :</p>
              <ul className="contact-list">
                <li className="contact-item">
                  <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                  <span>Email :</span>
                  <a href="mailto:support@queuemaster.com" className="contact-link">support@queuemaster.com</a>
                </li>
                <li className="contact-item">
                  <FontAwesomeIcon icon={faPhone} className="contact-icon" />
                  <span>Téléphone :</span>
                  <a href="tel:+261344431987" className="contact-link">+261 344 431 987</a>
                </li>
                <li className="contact-item">
                  <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                  <span>WhatsApp :</span>
                  <a href="https://wa.me/+261334334846" className="contact-link">+261 334 334 846</a>
                </li>
                <li className="contact-item">
                  <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                  <span>Facebook :</span>
                  <a href="https://www.facebook.com/eddian.radic/?_rdc=1&_rdr#" className="contact-link">@QueueMaster</a>
                </li>
              </ul>
              <p className="contact-hours">Horaires d'assistance : Lundi - Vendredi, 9h00 - 17h00 (EAT)</p>
              <p className="contact-note">* Réponse sous 24h maximum pour les emails.</p>
              
            </div>
          </div>
        </section>
      </main>
      <footer className="contact-footer">
        <div className="contact-container">
          <p>© 2025 QueueMaster par RAMIADANARIVO Nirina Eddiano. Tous droits réservés.</p>
          <div className="contact-footer-links">
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;