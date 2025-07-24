import React, { useState,useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faArrowRight, faTicketAlt, faSignInAlt  } from '@fortawesome/free-solid-svg-icons';
import simplicityBg from '../assets/images/simplicity-bg.jpg';
import reliabilityBg from '../assets/images/reliability-bg.jpg';
import comfortBg from '../assets/images/comfort-bg.jpg';
import mobilityBg from '../assets/images/mobility-bg.jpg';
import './Vitrines.css';

const PourquoiQueueMaster = () => {
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
                    <Link to="/pourquoi-queuemaster" className={location.pathname === '/pourquoi-queuemaster' ? 'vitrine-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>QueueMaster</Link>
                    <Link to="/nos-partenaires" onClick={() => setIsMenuOpen(false)}>Partenaires</Link>
                    <Link to="/faq" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                    <button onClick={() => navigate('/login')} className="vitrine-secondary-button" aria-label="Se connecter"><FontAwesomeIcon icon={faSignInAlt} /> Connexion</button>
                    <button onClick={() => navigate('/signup')} className="vitrine-cta-button" aria-label="S'inscrire">S'inscrire gratuitement <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></button>
                  </nav>
                  <FontAwesomeIcon icon={faBars} className="vitrine-menu-toggle" onClick={toggleMenu} />
                </div>
              </header>
      <main>
        <section className="vitrine-features">
          <div className="vitrine-container">
            <h3 className="vitrine-text-2xl vitrine-font-semibold vitrine-text-primary-blue" data-scroll="slide-up">Pourquoi choisir QueueMaster ?</h3>
            <div className="vitrine-features-grid">
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={simplicityBg} alt="Simplicity" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Simplicité</h4><p>Avec QueueMaster, prendre un ticket est un jeu d’enfant. En seulement trois clics, vous pouvez sélectionner votre banque, choisir le service dont vous avez besoin, et obtenir un ticket numérique. Notre interface utilisateur est conçue pour être claire et accessible, même pour les utilisateurs novices. Suivez votre position dans la file en temps réel grâce à une visualisation simple et intuitive, et recevez des mises à jour instantanées sur votre tour.</p></div>
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={reliabilityBg} alt="Reliability" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Fiabilité</h4><p>QueueMaster s’associe avec des banques de confiance pour garantir une expérience fluide et sans accroc. Nous collaborons avec des établissements financiers qui partagent notre vision d’un service client amélioré. Nos systèmes sont intégrés directement avec les infrastructures des banques, assurant une synchronisation parfaite entre votre ticket numérique et la gestion des files d’attente sur place. Vous pouvez compter sur QueueMaster pour une expérience fiable à chaque visite.</p></div>
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={comfortBg} alt="Comfort" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Confort</h4><p>Fini le stress d’attendre sans savoir quand sera votre tour. QueueMaster vous envoie des alertes en temps réel pour vous informer lorsque votre tour approche. Que vous soyez en train de prendre un café à proximité ou de faire des courses, vous recevrez une notification sur votre smartphone pour vous rappeler de revenir à la banque juste à temps. Profitez d’un confort inégalé et d’une gestion de votre temps optimisée avec QueueMaster.</p></div>
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={mobilityBg} alt="Mobility" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Mobilité</h4><p>QueueMaster est conçu pour s’adapter à votre style de vie mobile. Notre application est disponible sur iOS et Android, vous permettant de gérer vos files d’attente depuis n’importe où. Que vous soyez au travail, à la maison, ou en déplacement, vous pouvez prendre un ticket, suivre votre position, et recevoir des alertes directement sur votre smartphone. Avec QueueMaster, la gestion des files d’attente devient aussi mobile que vous l’êtes.</p></div>
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

export default PourquoiQueueMaster;