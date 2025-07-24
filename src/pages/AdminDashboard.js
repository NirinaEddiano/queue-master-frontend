import React, { useState, useEffect,useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTicketAlt,
  faClock,
  faSmile,
  faUsers,
  faPlus,
  faEdit,
  faTrash,
  faCalendarAlt,
  faSearch,
  faHistory,
  faChevronDown,
  faChevronUp,
  faTachometerAlt,
  faUser,
  faDesktop,
  faUserFriends,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';
import './styles.css';
import { Spiral } from 'ldrs/react';
import 'ldrs/react/Spiral.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [guichets, setGuichets] = useState([]);
  const [clients, setClients] = useState([]);
  const [guichetiers, setGuichetiers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTickets: 0,
    avgWaitingTime: 0,
    satisfaction: 0,
    activeGuichets: 0,
  });
  const [dailyStats, setDailyStats] = useState({ client_stats: { labels: [], data: [], label: '' }, guichet_stats: { labels: [], data: [], label: '' } });
  const [weeklyStats, setWeeklyStats] = useState({ client_stats: { labels: [], data: [], label: '' }, guichet_stats: { labels: [], data: [], label: '' } });
  const [monthlyStats, setMonthlyStats] = useState({ client_stats: { labels: [], data: [], label: '' }, guichet_stats: { labels: [], data: [], label: '' } });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredGuichetHistory, setFilteredGuichetHistory] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [guichetierSearch, setGuichetierSearch] = useState('');
  const [isGuichetSectionOpen, setIsGuichetSectionOpen] = useState(true);
  const [isClientSectionOpen, setIsClientSectionOpen] = useState(true);
  const [isHistorySectionOpen, setIsHistorySectionOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeSubSection, setActiveSubSection] = useState('journaliere');
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [allGuichets, setAllGuichets] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const fetchAllGuichets = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
  
    try {
      const response = await axios.get('http://localhost:8000/api/guichets/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllGuichets(response.data);
    } catch (err) {
      setError('Erreur lors du chargement de la liste complète des guichets.');
    }
  }, []); // Cette fonction n'a pas de dépendances réactives

  const fetchFilteredGuichetHistory = useCallback(async (guichetId = null) => {
    const token = localStorage.getItem('access_token');
    if (!token || !selectedBankId) {
      setError('ID de banque non sélectionné.');
      return;
    }

    try {
      let url = `http://localhost:8000/api/guichet/history/filtered/?bank_id=${selectedBankId}`;
      if (guichetId) {
        url += `&guichet_id=${guichetId}`;
      }
      if (startDate) {
        url += `&start_date=${startDate}`;
      }
      if (endDate) {
        url += `&end_date=${endDate}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFilteredGuichetHistory(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération de l’historique filtré: ' + (err.response?.data?.error || err.message));
      setFilteredGuichetHistory([]);
    }
  }, [selectedBankId, startDate, endDate]); 

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      const userResponse = await axios.get('http://localhost:8000/api/users/user/', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (userResponse.data.role !== 'admin') {
        setError('Accès non autorisé. Seuls les administrateurs peuvent accéder à cette page.');
        navigate('/login');
        return;
      }
  
      const banksResponse = await axios.get('http://localhost:8000/api/banks/', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (banksResponse.data.length === 0) {
        setError('Aucune banque n\'a été trouvée dans le système.');
        setLoading(false);
        return;
      }
      
      const currentBankId = banksResponse.data[0].id;
      setSelectedBankId(currentBankId);
  
      const [
        ticketsRes,
        guichetsRes,
        clientsRes,
        guichetHistoryRes,
        guichetiersRes,
      ] = await Promise.all([
        axios.get(`http://localhost:8000/api/tickets/?bank_id=${currentBankId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => ({ data: [] })),
        axios.get(`http://localhost:8000/api/guichets/?bank_id=${currentBankId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => ({ data: [] })),
        axios.get(`http://localhost:8000/api/users/?role=client`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => ({ data: [] })),
        axios.get(`http://localhost:8000/api/guichet/history/?bank_id=${currentBankId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => ({ data: [] })),
        axios.get(`http://localhost:8000/api/users/?role=guichetier`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => ({ data: [] })),
      ]);
  
      setTickets(ticketsRes.data);
      setGuichets(guichetsRes.data);
      setClients(clientsRes.data);
      setGuichetiers(guichetiersRes.data);
      setFilteredGuichetHistory(guichetHistoryRes.data);
      fetchAllGuichets();
  
      if (guichetsRes.data.length > 0 && location.pathname.includes('/admin')) {
        if(activeSection === 'historique'){
            setActiveSubSection(`guichet-${guichetsRes.data[0].id}`);
            fetchFilteredGuichetHistory(guichetsRes.data[0].id);
        }
      }
  
      if (ticketsRes.data.length === 0 && guichetsRes.data.length === 0) {
        setError('Aucune donnée disponible. Vérifiez que des données existent pour cette banque.');
      }
    } catch (err) {
      setError('Erreur lors de la récupération des données: ' + (err.response?.data?.error || err.message));
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
    // CORRECTION 2: Ajout des fonctions stabilisées au tableau de dépendances
  }, [navigate, location.pathname, activeSection, fetchAllGuichets, fetchFilteredGuichetHistory]);

  

  useEffect(() => {
    if (activeSection === 'guichets') {
      fetchAllGuichets();
    }
  }, [activeSection,fetchAllGuichets]);

  const filteredAllGuichets = allGuichets.filter((guichet) =>
    (guichet.user?.username || '').toLowerCase().includes(guichetierSearch.toLowerCase()) ||
    (guichet.number?.toString() || '').includes(guichetierSearch.toLowerCase())
  );

 

  const fetchStats = useCallback (async (period) => {
    if (!selectedBankId) return; 
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/stats/aggregate/?bank_id=${selectedBankId}&period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedData = {
        client_stats: {
          labels: response.data.client_stats.labels,
          data: response.data.client_stats.data,
          label: response.data.client_stats.label,
        },
        guichet_stats: {
          labels: response.data.guichet_stats.labels,
          data: response.data.guichet_stats.data,
          label: response.data.guichet_stats.label,
        },
      };

      if (period === 'daily') {
        setDailyStats(formattedData);
      } else if (period === 'weekly') {
        setWeeklyStats(formattedData);
      } else if (period === 'monthly') {
        setMonthlyStats(formattedData);
      }
    } catch (err) {
      setError('Erreur lors de la récupération des statistiques: ' + (err.response?.data?.error || err.message));
    }
  }, [navigate, selectedBankId]);

  useEffect(() => {
    fetchData();
    fetchStats('daily');
    fetchStats('weekly');
    fetchStats('monthly');
  }, [navigate, location,fetchData, fetchStats]);

  useEffect(() => {
    const totalTickets = tickets.length;
    const activeGuichets = guichets.filter((g) => g.status === 'open').length;
    const totalWaitingTime = tickets.reduce((sum, ticket) => sum + (ticket.waiting_time || 0), 0);
    const avgWaitingTime = totalTickets ? Math.round(totalWaitingTime / totalTickets) : 0;
    const satisfaction = totalTickets ? 92 : 0;

    setStats({
      totalTickets,
      avgWaitingTime,
      satisfaction,
      activeGuichets,
    });
  }, [tickets, guichets]);

  const handleGuichetAction = async (guichetId, action) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }

    try {
      if (action === 'edit') {
        navigate(`/admin/guichets/edit/${guichetId}`);
      } else if (action === 'delete') {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce guichet ?')) {
          await axios.delete(`http:///localhost:8000/api/guichets/${guichetId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setGuichets(guichets.filter((guichet) => guichet.id !== guichetId));
        }
      }
    } catch (err) {
      setError('Erreur lors de la gestion du guichet: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleGuichetierAction = async (guichetierId, action) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }

    try {
      if (action === 'edit') {
        if (!guichetierId || guichetierId === 'undefined' || isNaN(guichetierId)) {
          console.error('Invalid Guichetier ID:', guichetierId);
          setError('Erreur: ID du guichetier non valide.');
          return;
        }
        navigate(`/admin/guichetiers/edit/${guichetierId}`);
      } else if (action === 'delete') {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce guichetier ?')) {
          await axios.delete(`http://localhost:8000/api/guichetier/${guichetierId}/delete/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setGuichetiers(guichetiers.filter((guichetier) => guichetier.id !== guichetierId));
        }
      }
    } catch (err) {
      setError('Erreur lors de la gestion du guichetier: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };


  const filteredClients = clients.filter((client) =>
    client.username.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredGuichetiers = guichetiers.filter((guichetier) =>
    guichetier.username.toLowerCase().includes(guichetierSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-lg">Chargement...</div>
        <Spiral size="40" speed="0.9" color="blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className={`burger-menu ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <aside className={isMenuOpen ? 'active' : ''}>
        <div className="p-4">
          <h2 className="text-xl font-bold">Tableau de bord</h2>
          <h2 className="text-xl font-bold">d'Admin</h2>
        </div>
        <nav className="flex-1">
          <button
            onClick={() => { setActiveSection('dashboard'); closeMenu(); }}
            className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSection === 'dashboard' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
            Tableau de Bord
          </button>
          <button
            onClick={() => { setActiveSection('guichetiers'); closeMenu(); }}
            className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSection === 'guichetiers' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            Gestion Guichetiers
          </button>
          <button
            onClick={() => { setActiveSection('guichets'); closeMenu(); }}
            className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSection === 'guichets' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FontAwesomeIcon icon={faDesktop} className="mr-2" />
            Gestion Guichets
          </button>
          <button
            onClick={() => { setActiveSection('clients'); closeMenu(); }}
            className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSection === 'clients' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
            Gestion Clients
          </button>
          <button
            onClick={() => {
              setActiveSection('statistiques');
              setActiveSubSection('journaliere');
              closeMenu();
            }}
            className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSection === 'statistiques' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FontAwesomeIcon icon={faChartBar} className="mr-2" />
            Statistiques
          </button>
          {activeSection === 'statistiques' && (
            <div className="ml-4">
              <button
                onClick={() => { setActiveSubSection('journaliere'); closeMenu(); }}
                className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSubSection === 'journaliere' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Journalière
              </button>
              <button
                onClick={() => { setActiveSubSection('hebdomadaire'); closeMenu(); }}
                className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSubSection === 'hebdomadaire' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Hebdomadaire
              </button>
              <button
                onClick={() => { setActiveSubSection('mensuelle'); closeMenu(); }}
                className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSubSection === 'mensuelle' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Mensuelle
              </button>
            </div>
          )}
          <button
            onClick={() => {
              setActiveSection('historique');
              if (guichets.length > 0) {
                setActiveSubSection(`guichet-${guichets[0].id}`);
                fetchFilteredGuichetHistory(guichets[0].id);
              }
              closeMenu();
            }}
            className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSection === 'historique' ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FontAwesomeIcon icon={faHistory} className="mr-2" />
            Historique Activités
          </button>
          {activeSection === 'historique' && (
            <div className="ml-4">
              {allGuichets.map((guichet) => (
                <button
                  key={guichet.id}
                  onClick={() => {
                    setActiveSubSection(`guichet-${guichet.id}`);
                    fetchFilteredGuichetHistory(guichet.id, guichet.bank.id)
                    closeMenu();
                  }}
                  className={`w-full text-left px-4 py-2 mb-2 flex items-center transition-colors ${activeSubSection === `guichet-${guichet.id}` ? 'bg-accent-turquoise text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                   Guichet {guichet.number}
                </button>
              ))}
            </div>
          )}
        </nav>
        <button
          onClick={() => { handleLogout(); closeMenu(); }}
          className=" deconnexion bg-red-500  text-white px-4 py-2 rounded hover:bg-red-600 flex items-center mt-auto m-4"
        >
          <i className="fas fa-sign-out-alt mr-2"></i> Déconnexion
        </button>
      </aside>

      <div className={`flex-1 ${isMenuOpen ? 'blur-content' : ''}`} onClick={closeMenu}>
        <header className="bg-white shadow-md p-4 flex justify-end items-center">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 animate-slide-in flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i> {error}
            </div>
          )}

          {activeSection === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="card gold-border flex items-center hover:shadow-lg transition-shadow animate-slide-in">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <FontAwesomeIcon icon={faTicketAlt} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Tickets</h3>
                    <p className="text-2xl font-bold">{stats.totalTickets}</p>
                    <p className="text-sm">
                      +{Math.round(stats.totalTickets * 0.16)} par rapport à hier
                    </p>
                  </div>
                </div>
                <div className="card gold-border flex items-center hover:shadow-lg transition-shadow animate-slide-in">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4">
                    <FontAwesomeIcon icon={faClock} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Temps d’attente</h3>
                    <p className="text-2xl font-bold">{stats.avgWaitingTime} min</p>
                    <p className="text-sm">
                      {stats.avgWaitingTime > 0 ? '+3 min par rapport à hier' : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="card gold-border flex items-center hover:shadow-lg transition-shadow animate-slide-in">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <FontAwesomeIcon icon={faSmile} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Satisfaction</h3>
                    <p className="text-2xl font-bold">{stats.satisfaction}%</p>
                    <p className="text-sm">
                      {stats.satisfaction > 0 ? '+2% par rapport à hier' : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="card gold-border flex items-center hover:shadow-lg transition-shadow animate-slide-in">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <FontAwesomeIcon icon={faUsers} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Guichets actifs</h3>
                    <p className="text-2xl font-bold">
                      {stats.activeGuichets}/{guichets.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Analyse de la fréquentation</h3>
                  <Bar
                    data={{
                      labels: weeklyStats.client_stats.labels,
                      datasets: [
                        {
                          label: weeklyStats.client_stats.label,
                          data: weeklyStats.client_stats.data,
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Fréquentation journalière' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Jours' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre le nombre de tickets créés par jour cette semaine.
                  </p>
                </div>
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Temps d’attente moyen (minutes)</h3>
                  <Line
                    data={{
                      labels: weeklyStats.client_stats.labels,
                      datasets: [
                        {
                          label: 'Temps d’attente moyen (minutes)',
                          data: tickets.reduce((acc, ticket) => {
                            const date = new Date(ticket.date_heure).getDay();
                            acc[date === 0 ? 6 : date - 1] = (acc[date === 0 ? 6 : date - 1] || 0) + (ticket.waiting_time || 0);
                            return acc;
                          }, Array(7).fill(0)).map((total, i) => total / (tickets.filter(t => new Date(t.date_heure).getDay() === (i === 6 ? 0 : i + 1)).length || 1)),
                          fill: false,
                          borderColor: 'rgba(75, 192, 192, 1)',
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Minutes' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Jours' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre le temps d’attente moyen par jour.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'guichetiers' && (
            <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsGuichetSectionOpen(!isGuichetSectionOpen)}>
                <h3 className="text-lg font-semibold">Gestion des Guichetiers</h3>
                <FontAwesomeIcon icon={isGuichetSectionOpen ? faChevronUp : faChevronDown} />
              </div>
              {isGuichetSectionOpen && (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <label htmlFor="guichetierSearch" className="block text-sm font-medium mb-1">
                        Rechercher un guichetier
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="guichetierSearch"
                          value={guichetierSearch}
                          onChange={(e) => setGuichetierSearch(e.target.value)}
                          placeholder="Nom du guichetier..."
                          className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => navigate('/admin/guichetiers/add')}
                        className="bg-primary-blue text-white px-4 py-2 rounded flex items-center transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Guichetier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGuichetiers.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center">
                              Aucun guichetier disponible.
                            </td>
                          </tr>
                        ) : (
                          filteredGuichetiers.map((guichetier) => (
                            <tr key={guichetier.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">{guichetier.username}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{guichetier.email || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    guichetier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {guichetier.is_active ? 'Actif' : 'Suspendu'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleGuichetierAction(guichetier.id, 'edit')}
                                  className="mr-3 transition-colors"
                                  title="Modifier"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  onClick={() => handleGuichetierAction(guichetier.id, 'delete')}
                                  className="transition-colors"
                                  title="Supprimer"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'guichets' && (
            <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsGuichetSectionOpen(!isGuichetSectionOpen)}>
                <h3 className="text-lg font-semibold">Gestion des guichets</h3>
                <FontAwesomeIcon icon={isGuichetSectionOpen ? faChevronUp : faChevronDown} />
              </div>
              {isGuichetSectionOpen && (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <label htmlFor="guichetierSearch" className="block text-sm font-medium mb-1">
                        Rechercher un guichetier
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="guichetierSearch"
                          value={guichetierSearch}
                          onChange={(e) => setGuichetierSearch(e.target.value)}
                          placeholder=" Nom du guichetier..."
                          className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => navigate('/admin/guichets/add')}
                        className="bg-primary-blue text-white px-4 py-2 rounded flex items-center transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Guichet
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                           Banque
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Guichetier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAllGuichets.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 text-center">
                              Aucun guichet disponible.
                            </td>
                          </tr>
                        ) : (
                          filteredAllGuichets.map((guichet) => (
                            <tr key={guichet.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">{guichet.number}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{guichet.bank?.name || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{guichet.user?.username || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    guichet.status === 'open'
                                      ? 'bg-green-100 text-green-800'
                                      : guichet.status === 'paused'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {guichet.status === 'open' ? 'Ouvert' : guichet.status === 'paused' ? 'En pause' : 'Fermé'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{guichet.service?.name || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleGuichetAction(guichet.id, 'edit')}
                                  className="mr-3 transition-colors"
                                  title="Modifier"
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button
                                  onClick={() => handleGuichetAction(guichet.id, 'delete')}
                                  className="transition-colors"
                                  title="Supprimer"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'clients' && (
            <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsClientSectionOpen(!isClientSectionOpen)}>
                <h3 className="text-lg font-semibold">Gestion des Clients</h3>
                <FontAwesomeIcon icon={isClientSectionOpen ? faChevronUp : faChevronDown} />
              </div>
              {isClientSectionOpen && (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <label htmlFor="clientSearch" className="block text-sm font-medium mb-1">
                        Rechercher un client
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="clientSearch"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Nom du client..."
                          className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none"
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Tickets Actifs
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClients.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center">
                              Aucun client disponible.
                            </td>
                          </tr>
                        ) : (
                          filteredClients.map((client) => {
                            const clientTickets = tickets.filter(
                              (ticket) => ticket.user?.id === client.id && ticket.statut === 'attente'
                            );
                            return (
                              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">{client.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{client.email || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      client.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {client.is_active ? 'Actif' : 'Suspendu'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{clientTickets.length}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'statistiques' && activeSubSection === 'journaliere' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Statistiques Clients (Journalier)</h3>
                  <Bar
                    data={{
                      labels: dailyStats.client_stats.labels,
                      datasets: [
                        {
                          label: dailyStats.client_stats.label,
                          data: dailyStats.client_stats.data,
                          backgroundColor: 'rgba(75, 192, 192, 0.6)',
                          borderColor: 'rgba(75, 192, 192, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Nombre de Clients' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Heures' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre l’activité des clients par heure aujourd’hui.
                  </p>
                </div>
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Statistiques Guichets (Journalier)</h3>
                  <Bar
                    data={{
                      labels: dailyStats.guichet_stats.labels,
                      datasets: [
                        {
                          label: dailyStats.guichet_stats.label,
                          data: dailyStats.guichet_stats.data,
                          backgroundColor: 'rgba(255, 206, 86, 0.6)',
                          borderColor: 'rgba(255, 206, 86, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Nombre de Tickets Traités' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Guichets' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre le nombre de tickets traités par guichet aujourd’hui.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'statistiques' && activeSubSection === 'hebdomadaire' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Statistiques Clients (Hebdomadaire)</h3>
                  <Bar
                    data={{
                      labels: weeklyStats.client_stats.labels,
                      datasets: [
                        {
                          label: weeklyStats.client_stats.label,
                          data: weeklyStats.client_stats.data,
                          backgroundColor: 'rgba(75, 192, 192, 0.6)',
                          borderColor: 'rgba(75, 192, 192, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Nombre de Clients' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Jours' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre l’activité des clients par jour cette semaine.
                  </p>
                </div>
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Statistiques Guichets (Hebdomadaire)</h3>
                  <Bar
                    data={{
                      labels: weeklyStats.guichet_stats.labels,
                      datasets: [
                        {
                          label: weeklyStats.guichet_stats.label,
                          data: weeklyStats.guichet_stats.data,
                          backgroundColor: 'rgba(255, 206, 86, 0.6)',
                          borderColor: 'rgba(255, 206, 86, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Nombre de Tickets Traités' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Guichets' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre le nombre de tickets traités par guichet cette semaine.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'statistiques' && activeSubSection === 'mensuelle' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Statistiques Clients (Mensuel)</h3>
                  <Bar
                    data={{
                      labels: monthlyStats.client_stats.labels,
                      datasets: [
                        {
                          label: monthlyStats.client_stats.label,
                          data: monthlyStats.client_stats.data,
                          backgroundColor: 'rgba(75, 192, 192, 0.6)',
                          borderColor: 'rgba(75, 192, 192, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Nombre de Clients' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Jours' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre l’activité des clients par jour ce mois-ci.
                  </p>
                </div>
                <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
                  <h3 className="text-lg font-semibold mb-4">Statistiques Guichets (Mensuel)</h3>
                  <Bar
                    data={{
                      labels: monthlyStats.guichet_stats.labels,
                      datasets: [
                        {
                          label: monthlyStats.guichet_stats.label,
                          data: monthlyStats.guichet_stats.data,
                          backgroundColor: 'rgba(255, 206, 86, 0.6)',
                          borderColor: 'rgba(255, 206, 86, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Nombre de Tickets Traités' },ticks: {
                          stepSize: 1
                        } },
                        x: { title: { display: true, text: 'Guichets' } },
                      },
                    }}
                  />
                  <p className="mt-4">
                    Ce graphique montre le nombre de tickets traités par guichet ce mois-ci.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'historique' && activeSubSection.startsWith('guichet-') && (
            <div className="card gold-border hover:shadow-lg transition-shadow animate-slide-in">
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsHistorySectionOpen(!isHistorySectionOpen)}>
                <h3 className="text-lg font-semibold">Historique des activités des guichets</h3>
                <FontAwesomeIcon icon={isHistorySectionOpen ? faChevronUp : faChevronDown} />
              </div>
              {isHistorySectionOpen && (
                <>
                  <div className="fixed-header">
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex-1 min-w-[200px]">
                        <label htmlFor="startDate" className="block text-sm font-medium mb-1">
                          Date de début
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                          Date de fin
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => fetchFilteredGuichetHistory(activeSubSection.split('-')[1])}
                          className="bg-primary-blue text-white px-4 py-2 rounded flex items-center transition-colors"
                        >
                          <FontAwesomeIcon icon={faSearch} className="mr-2" />
                          Filtrer
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="min-w-full divide-y">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Guichet
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Ticket
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGuichetHistory.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 text-center">
                              Aucun historique disponible pour cette période.
                            </td>
                          </tr>
                        ) : (
                          filteredGuichetHistory.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {entry.guichet ? `Guichet ${entry.guichet.number}` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{entry.ticket_numero || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {entry.action === 'traite' ? 'Traité' : entry.action === 'called' ? 'Appelé' : entry.action}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(entry.created_at).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;