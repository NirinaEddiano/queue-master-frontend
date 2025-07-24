import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTicketAlt, faStar,  faQuestionCircle, faArrowRight,  faBars, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import queueBackgroundVideo1 from '../assets/video/queue-background-video1.mp4';
import queueBackgroundVideo2 from '../assets/video/queue-background-video2.mp4';
import queueBackgroundVideo3 from '../assets/video/queue-background-video3.mp4';
import bankAlphaLogo from '../assets/images/bank-alpha-logo.jpg';
import bankBetaLogo from '../assets/images/bank-beta-logo.jpg';
import bankGammaLogo from '../assets/images/bank-gamma-logo.jpg';
import simplicityBg from '../assets/images/simplicity-bg.jpg';
import reliabilityBg from '../assets/images/reliability-bg.jpg';
import comfortBg from '../assets/images/comfort-bg.jpg';
import mobilityBg from '../assets/images/mobility-bg.jpg';
import heroCreatorImage from '../assets/images/hero-creator-image.jpg'; 
import './Vitrines.css';

const Vitrine = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ setLiveStats] = useState({ tickets: 0, banks: 0 });
  const [ setCurrentTestimonial] = useState(0);
  const [ setTypedText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ setCurrentVideo] = useState(0);
  const videos = [queueBackgroundVideo1, queueBackgroundVideo2, queueBackgroundVideo3];

  const testimonials = [
    { text: '“QueueMaster a transformé mes visites en banque. Fini les longues attentes !”', author: 'Jean D.', title: 'Client fidèle'},
    { text: '“Les alertes en temps réel sont un game-changer. Super pratique !”', author: 'Amina K.', title: 'Professionnelle'},
    { text: '“Une interface simple et efficace. Je recommande !”', author: 'Marc L.', title: 'Nouvel utilisateur' }
  ];

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else clearInterval(typingInterval);
    }, 50);
    return () => clearInterval(typingInterval);
  }, [setTypedText]);

  useEffect(() => {
    axios.get('/api/stats/').then((res) => setLiveStats(res.data)).catch(() => setLiveStats({ tickets: 1, banks: 5 }));
  }, [setLiveStats]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length), 5000);
    const videoInterval = setInterval(() => setCurrentVideo((prev) => (prev + 1) % videos.length), 10000);
    return () => { clearInterval(interval); clearInterval(videoInterval); };
  }, [setCurrentTestimonial,setCurrentVideo,videos.length,testimonials.length]);

  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const fullText = 'Gérez vos files d’attente facilement : prenez un ticket, suivez votre position en temps réel et recevez des alertes.';

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
            <Link to="/" className={location.pathname === '/' ? 'vitrine-nav-active-link' : ''} onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            <Link to="/pourquoi-queuemaster" onClick={() => setIsMenuOpen(false)}>QueueMaster</Link>
            <Link to="/nos-partenaires" onClick={() => setIsMenuOpen(false)}>Partenaires</Link>
            <Link to="/faq" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
            <button onClick={() => navigate('/login')} className="vitrine-secondary-button" aria-label="Se connecter"><FontAwesomeIcon icon={faSignInAlt} /> Connexion</button>
            <button onClick={() => navigate('/signup')} className="vitrine-cta-button" aria-label="S'inscrire">S'inscrire gratuitement <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></button>
          </nav>
          <FontAwesomeIcon icon={faBars} className="vitrine-menu-toggle" onClick={toggleMenu} />
        </div>
      </header>
      <main>
      <section className="vitrine-hero">
          <div className="vitrine-container">
            <div className="vitrine-hero-content">
              <div className="vitrine-hero-text" data-scroll="slide-up">
                <h2>Gérez vos files d'attente, sans effort.</h2>
                <p>Prenez un ticket, suivez votre position en temps réel et recevez des alertes. Gagner du temps n'a jamais été aussi simple, rapide et sécurisé.</p>
                <div className="vitrine-hero-buttons">
                  <button onClick={() => navigate('/signup')} className="vitrine-cta-button">Commencer aujourd'hui <FontAwesomeIcon icon={faArrowRight} /></button>
                </div>
        
              </div>
              <div className="vitrine-hero-image-wrapper" data-scroll="zoom">
                 <img src={heroCreatorImage} alt="Personne utilisant QueueMaster sur un ordinateur portable" className="vitrine-hero-image" />
                 <div className="shape shape-1"></div>
                 <div className="shape shape-2"></div>
                 <div className="shape shape-3"></div>
                 
              </div>
            </div>
          </div>
        </section>
        <section className="vitrine-features">
          <div className="vitrine-container">
            <h3 data-scroll="slide-up">Pourquoi QueueMaster ?</h3>
            <div className="vitrine-features-grid">
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={simplicityBg} alt="Simplicity" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Simplicité</h4><p>Prenez un ticket en 3 clics et suivez votre tour en temps réel.</p></div>
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={reliabilityBg} alt="Reliability" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Fiabilité</h4><p>Partenariats avec des banques de confiance pour une expérience fluide.</p></div>
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={comfortBg} alt="Comfort" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Confort</h4><p>Recevez des alertes pour ne jamais manquer votre tour.</p></div>
              <div className="vitrine-feature-card" data-scroll="slide-left"><img src={mobilityBg} alt="Mobility" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Mobilité</h4><p>Gérez vos files d’attente depuis votre smartphone, où que vous soyez.</p></div>
            </div>
            <div className='button'>
            <button onClick={() => navigate('/pourquoi-queuemaster')} className="vitrine-cta-buttons vitrine-w-full vitrine-sm-w-auto vitrine-mt-6" aria-label="En savoir plus sur QueueMaster"><FontAwesomeIcon icon={faArrowRight} /> En savoir plus</button>
            </div>
          </div>
        </section>
        <section className="vitrine-partners">
          <div className="vitrine-container">
            <h3 data-scroll="slide-up">Nos Partenaires</h3>
            <div className="vitrine-partners-grid">
              <div className="vitrine-partner-card" data-scroll="zoom"><img src={bankAlphaLogo} alt="Bank Alpha" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>Bank of Africa</h4></div>
              <div className="vitrine-partner-card" data-scroll="zoom"><img src={bankBetaLogo} alt="Bank Beta" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>BNI Madagascar</h4></div>
              <div className="vitrine-partner-card" data-scroll="zoom"><img src={bankGammaLogo} alt="Bank Gamma" className="vitrine-img-full vitrine-h-48 vitrine-object-cover vitrine-mb-4" /><h4>BFV Madagascar</h4></div>
            </div>
            <div className='button'>
            <button onClick={() => navigate('/nos-partenaires')} className="vitrine-cta-buttons vitrine-w-full vitrine-sm-w-auto vitrine-mt-6" aria-label="En savoir plus sur nos partenaires"><FontAwesomeIcon icon={faArrowRight} /> En savoir plus</button>
            </div>
          </div>
        </section>

        <section className="vitrine-testimonials">
          <div className="vitrine-container">
            <h3>Rejoignez des milliers d'utilisateurs satisfaits</h3>
            <p className="section-subtitle">Découvrez pourquoi les créateurs, professionnels et familles adorent QueueMaster.</p>
            <div className="vitrine-testimonials-carousel">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="vitrine-testimonial-card" data-scroll="zoom" style={{transitionDelay: `${index * 100}ms`}}>
                  <FontAwesomeIcon icon={faStar} className="vitrine-card-icon" />
                  <p>"{testimonial.text}"</p>
                  <div className="vitrine-testimonial-author">
                    <div className="vitrine-testimonial-authors">
                      <div className="author-name">{testimonial.author}</div>
                      <div className="author-title">{testimonial.title}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="vitrine-faq">
          <div className="vitrine-container">
            <h3 data-scroll="slide-up">Questions Fréquentes</h3>
            <div className="vitrine-faq-grid">
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Comment prendre un ticket ?</h4></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Les alertes sont-elles fiables ?</h4></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Puis-je annuler un ticket ?</h4></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Quels types de services puis-je sélectionner ?</h4></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Comment suivre ma position dans la file ?</h4></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Comment contacter le support ?</h4></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Y a-t-il des frais pour utiliser QueueMaster ?</h4></div>
              <div className="vitrine-faq-card" data-scroll="zoom" onClick={() => navigate('/faq')}><FontAwesomeIcon icon={faQuestionCircle} className="vitrine-fa-icon" /><h4>Comment mettre à jour mes informations ?</h4></div>
            </div>
            <div className='button'>
            <button onClick={() => navigate('/faq')} className="vitrine-cta-buttons vitrine-w-full vitrine-sm-w-auto vitrine-mt-6" aria-label="Voir toutes les FAQ"><FontAwesomeIcon icon={faArrowRight} /> Voir toutes les FAQ</button>
            </div>
          </div>
        </section>
        <section className="vitrine-cta">
          <div className="vitrine-container">
            <h3 data-scroll="slide-up">Prêt à simplifier vos visites ?</h3>
            <p data-scroll="fade">Rejoignez QueueMaster et gérez vos files d’attente en toute simplicité.</p>
               <div className='boutons'>
                 <button onClick={() => navigate('/signup')} className="vitrine-cta-button vitrine-text-lg vitrine-cta-button vitrine-w-full vitrine-sm-w-auto vitrine-mt-6" aria-label="Rejoignez QueueMaster"><FontAwesomeIcon icon="fa-solid fa-user-plus" className="mr-2" /> S’inscrire</button>
                 <button onClick={() => navigate('/login')} className="vitrine-secondary-buttons vitrine-text-lg vitrine-w-full vitrine-sm-w-auto vitrine-mt-6" aria-label="Se connecter à QueueMaster"><FontAwesomeIcon icon="fa-solid fa-sign-in-alt" className="mr-2" /> Se connecter</button>
              </div>
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

export default Vitrine;