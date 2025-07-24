import React, { useState,useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faBars, faArrowRight, faTicketAlt, faSignInAlt  } from '@fortawesome/free-solid-svg-icons';
import './Vitrines.css';

const FAQ = () => {
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
    <div className="vitrine-wrapper">
      <header className="vitrine-header">
         <div className="vitrine-container vitrine-header-content">
                  <h1><FontAwesomeIcon icon={faTicketAlt} className="mr-2" /> QueueMaster</h1>
                  <nav className={isMenuOpen ? 'vitrine-nav vitrine-nav-active' : 'vitrine-nav'}>
                    <Link to="/"  onClick={() => setIsMenuOpen(false)}>Accueil</Link>
                    <Link to="/pourquoi-queuemaster" onClick={() => setIsMenuOpen(false)}>QueueMaster</Link>
                    <Link to="/nos-partenaires" onClick={() => setIsMenuOpen(false)}>Partenaires</Link>
                    <Link to="/faq" className={location.pathname === '/faq' ? 'vitrine-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                    <button onClick={() => navigate('/login')} className="vitrine-secondary-button" aria-label="Se connecter"><FontAwesomeIcon icon={faSignInAlt} /> Connexion</button>
                    <button onClick={() => navigate('/signup')} className="vitrine-cta-button" aria-label="S'inscrire">S'inscrire gratuitement <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></button>
                  </nav>
                  <FontAwesomeIcon icon={faBars} className="vitrine-menu-toggle" onClick={toggleMenu} />
                </div>
              </header>
      <main>
        <section className="vitrine-faq">
          <div className="vitrine-container">
            <h3 data-scroll="slide-up">Questions Fréquentes</h3>
            <div className="vitrine-faq-grid">
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Comment prendre un ticket ?</h4><p style={{ color: '#000' }}>Inscrivez-vous sur QueueMaster, choisissez une banque et un service, puis cliquez sur "Prendre un ticket". Votre ticket numérique sera généré instantanément.</p></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Les alertes sont-elles fiables ?</h4><p style={{ color: '#000' }}>Oui, notre système utilise une synchronisation en temps réel avec les banques pour envoyer des alertes précises lorsque votre tour approche.</p></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Puis-je annuler un ticket ?</h4><p style={{ color: '#000' }}>Absolument ! Vous pouvez annuler votre ticket à tout moment depuis la page "File d’attente" de l’application.</p></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Quels types de services puis-je sélectionner ?</h4><p style={{ color: '#000' }}>QueueMaster vous permet de choisir parmi une variété de services bancaires, comme les dépôts, retraits, ouverture de compte, ou consultations avec un conseiller.</p></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Comment suivre ma position dans la file ?</h4><p style={{ color: '#000' }}>Une fois votre ticket pris, vous pouvez voir votre position actuelle dans la file ainsi que le temps d’attente estimé directement sur l’application.</p></div>
            </div>
            <button onClick={() => navigate('/faq')} className="vitrine-cta-button vitrine-w-full vitrine-sm-w-auto vitrine-mt-6" aria-label="Voir toutes les FAQ"><FontAwesomeIcon icon={faArrowRight} /> Voir toutes les FAQ</button>
          </div>
        </section>
      </main>
      <footer className="vitrine-footer">
        <div className="vitrine-container">
          <p>© 2025 QueueMaster par RAMIADANARIVO Nirina Eddiano. Tous droits réservés.</p>
          <div className="vitrine-footer-links"><Link to="/contact">Contact</Link></div>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;