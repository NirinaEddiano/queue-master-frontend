import React, { useState,useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faArrowRight, faTicketAlt, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import bankAlphaLogo from '../assets/images/bank-alpha-logo.jpg';
import bankBetaLogo from '../assets/images/bank-beta-logo.jpg';
import bankGammaLogo from '../assets/images/bank-gamma-logo.jpg';
import './Vitrines.css';

const NosPartenaires = () => {
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
                    <Link to="/nos-partenaires" className={location.pathname === '/nos-partenaires' ? 'vitrine-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>Partenaires</Link>
                    <Link to="/faq" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                    <button onClick={() => navigate('/login')} className="vitrine-secondary-button" aria-label="Se connecter"><FontAwesomeIcon icon={faSignInAlt} /> Connexion</button>
                    <button onClick={() => navigate('/signup')} className="vitrine-cta-button" aria-label="S'inscrire">S'inscrire gratuitement <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></button>
                  </nav>
                  <FontAwesomeIcon icon={faBars} className="vitrine-menu-toggle" onClick={toggleMenu} />
                </div>
              </header>
      <main>
        <section className="vitrine-partners">
          <div className="vitrine-container">
            <h3 className="vitrine-text-2xl vitrine-font-semibold vitrine-text-primary-blue" data-scroll="slide-up">Nos Partenaires</h3>
            <div className="vitrine-partners-grid">                    
              <div className="vitrine-partner-card" data-scroll="zoom"><img src={bankAlphaLogo} alt="Bank Alpha" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Bank of Africa</h4><p>Bank of Africa est une institution financière de référence à Madagascar, reconnue pour ses solutions bancaires innovantes et son engagement envers ses clients. Avec une présence solide à Antananarivo et dans d'autres régions, Bank of Africa propose une gamme complète de services, allant de l'ouverture de comptes aux crédits et opérations de change. En partenariat avec QueueMaster, Bank of Africa a intégré notre système de gestion de files d'attente pour optimiser l'expérience client en agence. Grâce à QueueMaster, les temps d'attente sont réduits, offrant un service rapide et efficace pour toutes vos opérations bancaires.</p></div>
              <div className="vitrine-partner-card" data-scroll="zoom"><img src={bankBetaLogo} alt="Bank Beta" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>BNI Madagascar</h4><p>BNI Madagascar est une banque emblématique, engagée à fournir des services bancaires accessibles et de qualité à une clientèle variée, des particuliers aux entreprises. Avec un réseau d'agences couvrant tout Madagascar, BNI Madagascar se distingue par son approche client-centrée. En collaborant avec QueueMaster, BNI Madagascar a révolutionné la gestion des files d'attente dans ses agences. Notre système de ticketing numérique permet aux clients de planifier leurs visites, réduisant les temps d'attente et améliorant l'efficacité des services. Avec BNI Madagascar et QueueMaster, profitez d'une expérience bancaire fluide et sans stress.</p></div>
              <div className="vitrine-partner-card" data-scroll="zoom"><img src={bankGammaLogo} alt="Bank Gamma" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>BFV Madagascar</h4><p>BFV Madagascar est une banque moderne, axée sur l'innovation et la satisfaction de ses clients. Depuis des décennies, elle offre des solutions bancaires adaptées aux besoins des Malgaches, incluant les transferts d'argent, les comptes d'épargne et les services aux entreprises. En intégrant QueueMaster dans ses agences, BFV Madagascar a transformé l'expérience client en réduisant les files d'attente et en offrant un service plus personnalisé. Que vous soyez un particulier ou un professionnel, BFV Madagascar et QueueMaster vous garantissent une gestion bancaire rapide, efficace et agréable.</p></div>
            </div>
            <button onClick={() => navigate('/signup')} className="vitrine-cta-button vitrine-w-full vitrine-sm-w-auto vitrine-mt-6" aria-label="Commencer maintenant"><FontAwesomeIcon icon={faArrowRight} /> Commencer maintenant</button>
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

export default NosPartenaires;