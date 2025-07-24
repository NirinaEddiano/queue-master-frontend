import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ClientNavbar from './ClientNavbar';
import BordDroite from './BordDroite';
import './styles.css';

const Home = () => {
  const [banks, setBanks] = useState([]);
  const [services, setServices] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [clientId, setClientId] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [requiredDocuments, setRequiredDocuments] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [userTickets, setUserTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Veuillez vous connecter');
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      try {
        const userResponse = await axios.get('/api/users/user/');
        setUsername(userResponse.data.username);
        const bankResponse = await axios.get('/api/banks/');
        const bankData = bankResponse.data || [];
        setBanks(bankData);
        console.log('Banques chargées :', bankData);

        
        const ticketsResponse = await axios.get('/api/tickets/list/?user_only=true');
        const userTickets = ticketsResponse.data || [];
        setUserTickets(userTickets);
        console.log('Tickets utilisateur chargés :', userTickets);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        toast.error('Une erreur est survenue');
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (selectedBank && step >= 2) {
      const fetchServices = async () => {
        try {
          const response = await axios.get(`/api/services/?bank_id=${selectedBank}`);
          const serviceData = response.data || [];
          setServices(serviceData);
          console.log('Services chargés pour bank_id', selectedBank, ':', serviceData);
          if (serviceData.length === 0) {
            setError('Aucun service disponible pour cette banque');
            setStep(1);
          }
        } catch (err) {
          setError('Erreur lors du chargement des services');
          toast.error('Une erreur est survenue');
        }
      };
      fetchServices();
    } else {
      setServices([]);
      setSelectedService('');
      setSelectedSubCategory('');
      setSelectedStatus('');
      setRequiredDocuments('');
    }
  }, [selectedBank, step]);

  useEffect(() => {
    if (selectedService && selectedBank && step >= 2) {
      const fetchServiceDetails = async () => {
        try {
          const response = await axios.get(`/services/${selectedService}/details/?bank_id=${selectedBank}`);
          console.log('Réponse API pour détails du service:', response.data);
          const subCats = Array.isArray(response.data.sub_categories)
            ? response.data.sub_categories
            : typeof response.data.sub_categories === 'string'
            ? JSON.parse(response.data.sub_categories)
            : [];
          setSubCategories(subCats);
          setRequiredDocuments(response.data.required_documents || '');
        } catch (err) {
          console.error('Erreur lors de fetchServiceDetails:', err);
          setError(`Erreur lors du chargement des détails du service ${selectedService}`);
          toast.error('Service non trouvé');
          setSelectedService('');
          setSubCategories([]);
          setRequiredDocuments('');
        }
      };
      fetchServiceDetails();
    } else {
      setSubCategories([]);
      setRequiredDocuments('');
    }
  }, [selectedService, selectedBank, step]);

  const handleBankSelect = () => {
    if (!selectedBank) {
      toast.error('Veuillez sélectionner une banque');
      return;
    }
    setStep(2);
  };

  const handleServiceSelect = () => {
    if (!selectedService) {
      toast.error('Veuillez sélectionner un service');
      return;
    }
    if (subCategories.length > 0 && !selectedSubCategory) {
      toast.error('Veuillez sélectionner une sous-catégorie');
      return;
    }
    setStep(3);
  };

  const handleStatusSelect = () => {
    if (!selectedStatus) {
      toast.error('Veuillez sélectionner votre statut');
      return;
    }
    setStep(4);
  };

  const handleClientDetails = () => {
    setStep(5);
  };

  const handleConfirmation = async () => {
    try {
      const payload = {
        bank_id: selectedBank,
        service_id: selectedService,
        user_status: selectedStatus,
        client_id: clientId || null,
        sub_category: selectedSubCategory || null,
        is_urgent: isUrgent,
      };
      console.log('Payload envoyé :', payload);
      const response = await axios.post('/api/tickets/create/', payload);
      toast.success(`Ticket ${response.data.numero} créé avec succès !`);
      navigate(`/suivi-ticket?bank_id=${selectedBank}&service_id=${selectedService}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de la création du ticket';
      setError(errorMessage);
      toast.error(errorMessage);
      setStep(5);
    }
  };

  const featuredServices = [
    { id: 8 , name: 'Dépôt', icon: 'fa-money-bill-wave', description: 'Déposez de l’argent en espèces ou par chèque.' },
    { id: 10, name: 'Prêt personnel', icon: 'fa-hand-holding-usd', description: 'Demandez un prêt pour vos projets.' },
    { id: 16, name: 'Retrait', icon: 'fa-wallet', description: 'Retirez de l’argent en toute simplicité.' },
  ];

  

  const handleTakeTicket = () => {
    setStep(1);
    const step1Section = document.getElementById('step1');
    if (step1Section) {
      step1Section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderStepContent = () => {
    console.log('Étape actuelle :', step, {
      selectedBank,
      selectedService,
      selectedSubCategory,
      selectedStatus,
      isUrgent,
    });

    switch (step) {
      case 1:
        return (
          <div id="step1" className="card gold-border animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-university mr-2 text-accent-gold animate-pulse"></i> Étape 1 : Choisir une banque
            </h2>
            <div className="mb-4">
              <label className="block text-primary-blue mb-2 font-medium flex items-center">
                <i className="fas fa-building mr-2 text-accent-turquoise"></i> Banque
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
              >
                <option value="">Sélectionnez une banque</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleBankSelect}
              className="cta-button w-full flex items-center justify-center"
              disabled={!selectedBank}
            >
              <i className="fas fa-arrow-right mr-2"></i> Continuer
            </button>
            <div className="mt-4 p-4 bg-bg-light rounded-lg">
              <p className="text-accent-turquoise font-semibold flex items-center">
                <i className="fas fa-info-circle mr-1"></i> Étape 1/5
              </p>
              <p className="text-gray-600">
                Sélectionnez la banque où vous souhaitez effectuer votre opération.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="card gold-border animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-cog mr-2 text-accent-gold animate-pulse"></i> Étape 2 : Choisir un service et motif
            </h2>
            <div className="mb-4">
              <label className="block text-primary-blue mb-2 font-medium flex items-center">
                <i className="fas fa-concierge-bell mr-2 text-accent-turquoise"></i> Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setSelectedSubCategory('');
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                disabled={!selectedBank}
              >
                <option value="">Sélectionnez un service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            {Array.isArray(subCategories) && subCategories.length > 0 && (
              <div className="mb-4">
                <label className="block text-primary-blue mb-2 font-medium flex items-center">
                  <i className="fas fa-list mr-2 text-accent-turquoise"></i> Sous-catégorie
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                  disabled={!selectedService}
                >
                  <option value="">Sélectionnez une sous-catégorie</option>
                  {subCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="secondary-button w-1/2 flex items-center justify-center"
              >
                <i className="fas fa-arrow-left mr-2"></i> Retour
              </button>
              <button
                onClick={handleServiceSelect}
                className="cta-button w-1/2 flex items-center justify-center"
                disabled={!selectedService || (subCategories.length > 0 && !selectedSubCategory)}
              >
                <i className="fas fa-arrow-right mr-2"></i> Continuer
              </button>
            </div>
            <div className="mt-4 p-4 bg-bg-light rounded-lg">
              <p className="text-accent-turquoise font-semibold flex items-center">
                <i className="fas fa-info-circle mr-1"></i> Étape 2/5
              </p>
              <p className="text-gray-600">
                Choisissez le service et, si applicable, le motif de votre visite.
              </p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="card gold-border animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-user mr-2 text-accent-gold animate-pulse"></i> Étape 3 : Votre statut
            </h2>
            {requiredDocuments && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-primary-blue font-semibold flex items-center">
                  <i className="fas fa-file-alt mr-2 text-accent-turquoise"></i> Documents à apporter :
                </p>
                <p className="text-gray-600">{requiredDocuments}</p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-primary-blue mb-2 font-medium flex items-center">
                <i className="fas fa-user-tag mr-2 text-accent-turquoise"></i> Statut
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                disabled={!selectedService}
              >
                <option value="">Sélectionnez votre statut</option>
                <option value="student">Étudiant</option>
                <option value="employee">Employé</option>
                <option value="retired">Retraité</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="flex items-center text-primary-blue">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="mr-2"
                />
                <i className="fas fa-exclamation-circle mr-2 text-accent-turquoise"></i> Demande urgente (ex. : carte perdue)
              </label>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                className="secondary-button w-1/2 flex items-center justify-center"
              >
                <i className="fas fa-arrow-left mr-2"></i> Retour
              </button>
              <button
                onClick={handleStatusSelect}
                className="cta-button w-1/2 flex items-center justify-center"
                disabled={!selectedStatus}
              >
                <i className="fas fa-arrow-right mr-2"></i> Continuer
              </button>
            </div>
            <div className="mt-4 p-4 bg-bg-light rounded-lg">
              <p className="text-accent-turquoise font-semibold flex items-center">
                <i className="fas fa-info-circle mr-1"></i> Étape 3/5
              </p>
              <p className="text-gray-600">
                Indiquez votre statut et si votre demande est urgente.
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="card gold-border animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-id-card mr-2 text-accent-gold animate-pulse"></i> Étape 4 : Identification
            </h2>
            <div className="mb-4">
              <label className="block text-primary-blue mb-2 font-medium flex items-center">
                <i className="fas fa-id-badge mr-2 text-accent-turquoise"></i> Numéro de client (facultatif)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Entrez votre numéro de client"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setStep(3)}
                className="secondary-button w-1/2 flex items-center justify-center"
              >
                <i className="fas fa-arrow-left mr-2"></i> Retour
              </button>
              <button
                onClick={handleClientDetails}
                className="cta-button w-1/2 flex items-center justify-center"
              >
                <i className="fas fa-arrow-right mr-2"></i> Continuer
              </button>
            </div>
            <div className="mt-4 p-4 bg-bg-light rounded-lg">
              <p className="text-accent-turquoise font-semibold flex items-center">
                <i className="fas fa-info-circle mr-1"></i> Étape 4/5
              </p>
              <p className="text-gray-600">
                Fournissez votre numéro de client si vous en avez un.
              </p>
            </div>
          </div>
        );
      case 5:
        const selectedBankObj = banks.find((b) => String(b.id) === String(selectedBank));
        const selectedServiceObj = services.find((s) => String(s.id) === String(selectedService));

        return (
          <div className="card gold-border animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-ticket-alt mr-2 text-accent-gold animate-pulse"></i> Étape 5 : Confirmer votre demande
            </h2>
            <p className="mb-4 text-gray-600">
              <strong><i className="fas fa-building mr-1"></i> Banque :</strong> {selectedBankObj ? selectedBankObj.name : 'Non sélectionnée'}<br />
              <strong><i className="fas fa-concierge-bell mr-1"></i> Service :</strong> {selectedServiceObj ? selectedServiceObj.name : 'Non sélectionné'}<br />
              {selectedSubCategory && <><strong><i className="fas fa-list mr-1"></i> Sous-catégorie :</strong> {selectedSubCategory}<br /></>}
              <strong><i className="fas fa-user-tag mr-1"></i> Statut :</strong> {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}<br />
              {clientId && <><strong><i className="fas fa-id-badge mr-1"></i> Numéro de client :</strong> {clientId}<br /></>}
            </p>
            {requiredDocuments && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-primary-blue font-semibold flex items-center ">
                  <i className="fas fa-file-alt mr-2 text-accent-turquoise"></i> Documents à apporter :
                </p>
                <p className="text-gray-600">{requiredDocuments}</p>
              </div>
            )}
            <div className="flex space-x-4">
              <button
                onClick={() => setStep(4)}
                className="secondary-button w-1/2 flex items-center justify-center"
              >
                <i className="fas fa-arrow-left mr-2"></i> Retour
              </button>
              <button
                onClick={handleConfirmation}
                className="cta-button w-1/2 flex items-center justify-center"
                disabled={!selectedBankObj || !selectedServiceObj}
              >
                <i className="fas fa-ticket-alt mr-2"></i> Obtenir un ticket
              </button>
            </div>
            <div className="mt-4 p-4 bg-bg-light rounded-lg">
              <p className="text-accent-turquoise font-semibold flex items-center">
                <i className="fas fa-info-circle mr-1"></i> Étape 5/5
              </p>
              <p className="text-gray-600">
                Vérifiez vos informations et confirmez pour recevoir votre ticket.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <ClientNavbar />
      <main className="p-8 max-w-4xl mx-auto">
        <div className="mb-8 animate-slide-in">
          <div className="titre bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg shadow-lg">
            <h1 className=" text-3xl font-bold mb-4 flex items-center">
              <i className="fas fa-home mr-2 text-accent-gold animate-pulse"></i> Bienvenue, {username || 'Client'} !
            </h1>
            <p className="text-lg mb-4 flex items-center">
              <i className="fas fa-ticket-alt mr-2 text-accent-turquoise"></i> Prenez un ticket ou un rendez-vous en quelques clics avec 
            </p>
            <p className="text-lg mb-4 flex items-center">QueueMaster.</p>
            <div className="flex space-x-4">
              <button
                onClick={handleTakeTicket}
                className="bg-accent-gold text-primary-blue px-6 py-2 rounded-lg hover:bg-yellow-500 transition-colors flex items-center"
              >
                <i className="fas fa-ticket-alt mr-2"></i> Prendre un Ticket
              </button>
              <button
                onClick={() => navigate('/rendez-vous')}
                className="bg-accent-turquoise text-primary-blue px-6 py-2 rounded-lg hover:bg-teal-500 transition-colors flex items-center"
              >
                <i className="fas fa-calendar-alt mr-2"></i> Prendre un Rendez-vous
              </button>
            </div>
          </div>
        </div>
        {userTickets.length > 0 && (
          <div className="mb-8 animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center ">
              <i className="fas fa-ticket-alt mr-2 text-accent-gold animate-pulse"></i> Vos Tickets Actifs
            </h2>
            <div className="card gold-border p-4">
              <div className="space-y-4">
                {userTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-primary-blue">
                        Ticket {ticket.numero} - {ticket.service.name}
                      </p>
                      <p className="text-gray-600">Banque: {ticket.bank.name}</p>
                      <p className="text-gray-600">
                        Position: {ticket.position != null ? `${ticket.position}e` : 'Calcul en cours...'}
                      </p>
                    </div>
                    <Link
                      to={`/suivi-ticket?bank_id=${ticket.bank.id}&service_id=${ticket.service.id}`}
                      className="primary-button flex items-center"
                    >
                      <i className="fas fa-eye mr-2"></i> Suivre la file
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mb-8 animate-slide-in">
          <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center">
            <i className="fas fa-star mr-2 text-accent-gold animate-pulse"></i> Services Populaires
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredServices.map((service) => (
              <div
                key={service.name}
                className="card gold-border p-4 hover:shadow-lg transition-shadow cursor-pointer" 
              >
                <i className={`fas ${service.icon} text-3xl text-accent-gold mb-2 animate-pulse`}></i>
                <h3 className="text-lg font-semibold text-primary-blue">{service.name}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
        {error && (
          <p className="text-red-500 mb-6 p-4 bg-red-50 rounded-lg animate-slide-in flex items-center">
            <i className="fas fa-exclamation-triangle mr-2 text-red-500"></i> {error}
          </p>
        )}
        {renderStepContent()}
      </main>
      <BordDroite />
    </div>
  );
};

export default Home;