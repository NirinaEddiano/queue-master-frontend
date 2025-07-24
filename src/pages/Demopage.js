import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './styles.css';

const DemoPage = () => {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [waitTime, setWaitTime] = useState(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [bank, setBank] = useState('');
  const [service, setService] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    let interval;
    if (isInQueue && queuePosition > 1) {
      interval = setInterval(() => {
        setQueuePosition((prev) => {
          const newPosition = prev - (Math.random() > 0.7 ? 2 : 1); // Randomly skip positions
          if (newPosition <= 3 && newPosition > 1) {
            toast.info('Votre tour approche !', { autoClose: 2000 });
            setNotifications((prev) => [
              ...prev,
              { message: 'Votre tour approche !', time: new Date().toLocaleTimeString() },
            ]);
          }
          return Math.max(1, Math.floor(newPosition));
        });
        setWaitTime((prev) => Math.max(0, prev - 1));
      }, 4000); // Update every 4 seconds
    } else if (queuePosition === 1) {
      toast.success('C’est votre tour ! Rendez-vous au guichet.', { autoClose: 4000 });
      setNotifications((prev) => [
        ...prev,
        { message: 'C’est votre tour !', time: new Date().toLocaleTimeString() },
      ]);
      setShowStickyCTA(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isInQueue, queuePosition]);

  const handleTakeTicket = () => {
    if (!bank || !service) {
      toast.error('Veuillez sélectionner une banque et un service.', { autoClose: 2000 });
      return;
    }
    const ticketNumber = Math.floor(1000 + Math.random() * 9000);
    setTicket({ number: ticketNumber, bank, service });
    setQueuePosition(12); // Start at position 12
    setWaitTime(24); // Estimated 24 minutes
    setIsInQueue(true);
    setNotifications([
      { message: `Ticket #${ticketNumber} pris pour ${service} à ${bank}`, time: new Date().toLocaleTimeString() },
    ]);
    toast.success('Ticket pris avec succès !', { autoClose: 2000 });
    setShowStickyCTA(true);
  };

  const handleCancelTicket = () => {
    setTicket(null);
    setQueuePosition(null);
    setWaitTime(null);
    setIsInQueue(false);
    setNotifications((prev) => [
      ...prev,
      { message: 'Ticket annulé.', time: new Date().toLocaleTimeString() },
    ]);
    setBank('');
    setService('');
    toast.info('Ticket annulé.', { autoClose: 2000 });
    setShowStickyCTA(false);
  };

  const handleReset = () => {
    setTicket(null);
    setQueuePosition(null);
    setWaitTime(null);
    setIsInQueue(false);
    setNotifications([]);
    setBank('');
    setService('');
    toast.info('Démo réinitialisée.', { autoClose: 2000 });
    setShowStickyCTA(false);
  };

  return (
    <div className="min-h-screen bg-bg-light p-6 relative">
      <header className="flex justify-between items-center max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-primary-blue flex items-center font-poppins">
          <i className="fas fa-ticket-alt mr-2 text-accent-gold animate-pulse" aria-hidden="true"></i> Démo QueueMaster
        </h1>
        <button
          onClick={() => navigate('/')}
          className="secondary-button"
          aria-label="Retour à la page d'accueil"
        >
          <i className="fas fa-arrow-left mr-2"></i> Retour
        </button>
      </header>
      <main className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-primary-blue mb-6 font-poppins animate-slide-in">
          Découvrez QueueMaster en action
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 animate-fade-in">
          Simulez la prise d’un ticket, suivez votre position en temps réel, et recevez des alertes comme dans la vraie application.
        </p>
        {!isInQueue ? (
          <div className="card gold-border p-8 mx-auto max-w-lg mb-8 animate-slide-in">
            <h3 className="text-2xl font-semibold text-primary-blue mb-4">Prendre un ticket</h3>
            <div className="mb-4">
              <label htmlFor="bank-select" className="block text-left text-gray-600 mb-2">
                Choisir une banque
              </label>
              <select
                id="bank-select"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                aria-label="Sélectionner une banque"
              >
                <option value="">Sélectionner une banque</option>
                <option value="Banque A - Centre-Ville">Banque A - Centre-Ville</option>
                <option value="Banque B - Nord">Banque B - Nord</option>
                <option value="Banque C - Est">Banque C - Est</option>
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="service-select" className="block text-left text-gray-600 mb-2">
                Choisir un service
              </label>
              <select
                id="service-select"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                aria-label="Sélectionner un service"
              >
                <option value="">Sélectionner un service</option>
                <option value="Dépôt en espèces">Dépôt en espèces</option>
                <option value="Retrait">Retrait</option>
                <option value="Consultation">Consultation</option>
              </select>
            </div>
            <button
              onClick={handleTakeTicket}
              className="cta-button text-lg animate-pulse"
              aria-label="Prendre un ticket virtuel"
            >
              <i className="fas fa-ticket-alt mr-2"></i> Prendre un ticket
            </button>
          </div>
        ) : (
          <div className="card gold-border p-8 mx-auto max-w-lg mb-8 animate-slide-in">
            <h3 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center justify-center">
              <img src="/images/bank-a.png" alt="Banque Logo" className="h-8 mr-2" /> Votre ticket
            </h3>
            <div className="text-left mb-6">
              <p className="text-lg mb-2">
                <strong>Numéro du ticket :</strong> {ticket.number}
              </p>
              <p className="text-lg mb-2">
                <strong>Banque :</strong> {ticket.bank}
              </p>
              <p className="text-lg mb-2">
                <strong>Service :</strong> {ticket.service}
              </p>
              <p className="text-lg mb-2 transition-all duration-500 ease-in-out">
                <strong>Position dans la file :</strong> {queuePosition}
              </p>
              <p className="text-lg mb-4 transition-all duration-500 ease-in-out">
                <strong>Temps d’attente estimé :</strong> ~{waitTime} minutes
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className="bg-accent-turquoise h-4 rounded-full transition-all duration-500"
                  style={{ width: `${((12 - queuePosition) / 11) * 100}%` }}
                ></div>
              </div>
            </div>
            {/* Timeline */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-primary-blue mb-2">Historique</h4>
              <ul className="text-left text-gray-600">
                {notifications.map((note, index) => (
                  <li key={index} className="mb-2 flex items-center">
                    <i className="fas fa-circle text-xs text-accent-gold mr-2"></i>
                    {note.message} <span className="ml-2 text-sm">({note.time})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCancelTicket}
                className="secondary-button text-lg"
                aria-label="Annuler le ticket"
              >
                <i className="fas fa-times mr-2"></i> Annuler
              </button>
              <button
                onClick={handleReset}
                className="secondary-button text-lg"
                aria-label="Réinitialiser la démo"
              >
                <i className="fas fa-redo mr-2"></i> Réinitialiser
              </button>
            </div>
          </div>
        )}
        {/* Learn More Section */}
        <section className="mb-12 animate-slide-in">
          <h3 className="text-3xl font-bold text-primary-blue mb-6 font-poppins text-center">
            Pourquoi choisir QueueMaster ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card gold-border text-primary-blue p-6">
              <i className="fas fa-bolt text-3xl text-accent-gold mb-4" aria-hidden="true"></i>
              <h4 className="text-xl font-semibold mb-2">Simplicité</h4>
              <p>Gérez vos files d’attente en quelques clics.</p>
            </div>
            <div className="card gold-border text-primary-blue p-6">
              <i className="fas fa-bell text-3xl text-accent-gold mb-4" aria-hidden="true"></i>
              <h4 className="text-xl font-semibold mb-2">Alertes</h4>
              <p>Recevez des notifications en temps réel.</p>
            </div>
            <div className="card gold-border text-primary-blue p-6">
              <i className="fas fa-mobile-alt text-3xl text-accent-gold mb-4" aria-hidden="true"></i>
              <h4 className="text-xl font-semibold mb-2">Mobilité</h4>
              <p>Utilisez QueueMaster depuis votre smartphone.</p>
            </div>
          </div>
        </section>
        {/* Final CTA */}
        <section className="text-center mb-12 animate-slide-in">
          <h3 className="text-3xl font-bold text-primary-blue mb-4 font-poppins">
            Prêt à simplifier vos visites en banque ?
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Inscrivez-vous pour gérer vos files d’attente avec QueueMaster.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="cta-button text-lg animate-pulse"
            aria-label="S'inscrire à QueueMaster"
          >
            <i className="fas fa-user-plus mr-2"></i> S’inscrire maintenant
          </button>
        </section>
      </main>
      {/* Sticky CTA */}
      {showStickyCTA && (
        <div className="fixed bottom-4 right-4 z-20 animate-fade-in">
          <button
            onClick={() => navigate('/signup')}
            className="cta-button text-lg animate-pulse"
            aria-label="S'inscrire à QueueMaster"
          >
            S’inscrire
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoPage;