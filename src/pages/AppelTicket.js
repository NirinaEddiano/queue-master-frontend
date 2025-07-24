import React, { useState, useEffect, useRef,useCallback  } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../utils/axiosConfig';
import Chart from 'chart.js/auto';
import 'ldrs/ring';
import { Spiral } from 'ldrs/react';
import './AppelTicket.css';

const AppelTicket = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const [guichet, setGuichet] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [treatedTickets, setTreatedTickets] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('closed');
  const [error, setError] = useState('');
  const [setWs] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isPris, setIsPris] = useState(false);
  const [absentTimer, setAbsentTimer] = useState(120);
  const [countdown, setCountdown] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [specificTicketId, setSpecificTicketId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ ticketsProcessed: 0, averageWaitTime: 0, satisfactionRate: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [ticketFilter, setTicketFilter] = useState('attente');
  const [dateFilter, setDateFilter] = useState('');
  const [activeSection, setActiveSection] = useState('gestion');
  const [activeSousSection, setActiveSousSection] = useState('journaliere');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isStatsSubMenuOpen, setIsStatsSubMenuOpen] = useState(false);
  const wsRef = useRef(null);
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef(5000);
  const isConnecting = useRef(false);
  const isMounted = useRef(true);
  const connectionLock = useRef(false);
  const countdownTimerRef = useRef(null);

  const WS_BASE_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000';

  const handleApiError = (err, setError, defaultMessage) => {
    const message = err.response?.data?.error || defaultMessage;
    setError(message);
    toast.error(message);
    console.error('Erreur API:', err);
  };

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      console.error('Aucun jeton de rafraîchissement disponible');
      toast.error('Session expirée. Veuillez vous reconnecter.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
      return null;
    }
    try {
      const response = await axios.post('/api/token/refresh/', { refresh: refreshToken });
      const newAccessToken = response.data.access;
      localStorage.setItem('access_token', newAccessToken);
      return newAccessToken;
    } catch (err) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return null;
    }
  }, [navigate, refreshToken]);

  const handleLogout = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'User logged out');
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setWs(null);
    wsRef.current = null;
    setGuichet(null);
    setTickets([]);
    setTreatedTickets([]);
    setHistory([]);
    setCurrentTicket(null);
    setError('');
    toast.success('Déconnexion réussie');
    navigate('/');
  };

  const fetchStats = useCallback(async (period = 'journaliere') => {
    try {
      const today = new Date();
      let startDate, endDate;

      if (period === 'journaliere') {
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
      } else if (period === 'hebdomadaire') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (period === 'mensuelle') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      }

      const historyResponse = await axios.get('/api/stats/', {
        params: { period, start_date: startDate, end_date: endDate },
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyData = historyResponse.data;

      if (!Array.isArray(historyData)) {
        throw new Error('Réponse inattendue: les données historiques ne sont pas un tableau');
      }

      const ticketsProcessed = historyData.filter((entry) => entry.action === 'traite').length;
      const processedTickets = historyData.filter((entry) => entry.action === 'traite');
      const waitTimes = [];
      for (const entry of processedTickets) {
        const calledEntry = historyData.find((h) => h.ticket_numero === entry.ticket_numero && h.action === 'appelé' && new Date(h.created_at) < new Date(entry.created_at));
        if (calledEntry) {
          const waitTime = (new Date(entry.created_at) - new Date(calledEntry.created_at)) / 1000 / 60;
          waitTimes.push(waitTime);
        }
      }
      const averageWaitTime = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
      const satisfactionRate = 92;

      setStats({
        ticketsProcessed,
        averageWaitTime: averageWaitTime.toFixed(1),
        satisfactionRate,
      });

      if (chartRef.current) chartRef.current.destroy();
      if (canvasRef.current) {
        chartRef.current = new Chart(canvasRef.current, {
          type: 'bar',
          data: {
            labels: ['Tickets Traités', 'Temps Moyen (min)', 'Satisfaction (%)'],
            datasets: [{
              label: 'Statistiques',
              data: [ticketsProcessed, averageWaitTime, satisfactionRate],
              backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'],
              borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
              borderWidth: 1,
            }],
          },
          options: {
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Valeur' } } },
            plugins: { legend: { display: false } },
          },
        });
      }
    } catch (err) {
      console.error('Erreur lors du calcul des statistiques:', err);
    }
  }, [token]);

  const sendBroadcastNotification = async () => {
    if (!broadcastMessage) {
      toast.error('Veuillez entrer un message à diffuser.');
      return;
    }
    if (!guichet) {
      toast.error('Guichet non chargé.');
      return;
    }
    try {
      await axios.post('/api/notifications/custom/', { message: broadcastMessage, bank_id: guichet.bank_id, service_id: guichet.service_id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Notification diffusée à tous les clients en attente.');
      setBroadcastMessage('');
    } catch (err) {
      handleApiError(err, setError, 'Erreur lors de l’envoi de la notification');
    }
  };

  const sendSpecificNotification = async () => {
    if (!customMessage || !specificTicketId) {
      toast.error('Veuillez sélectionner un ticket et entrer un message.');
      return;
    }
    if (!guichet) {
      toast.error('Guichet non chargé.');
      return;
    }
    try {
      await axios.post('/api/notifications/custom/', { ticket_id: specificTicketId, message: customMessage, bank_id: guichet.bank_id, service_id: guichet.service_id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Notification envoyée au ticket ${specificTicketId}.`);
      setCustomMessage('');
      setSpecificTicketId('');
    } catch (err) {
      handleApiError(err, setError, 'Erreur lors de l’envoi de la notification');
    }
  };

  const refreshData = useCallback(async () => {
    if (!guichet) return;
    try {
      const [ticketsResponse, historyResponse] = await Promise.all([
        axios.get('/api/tickets/list/', { params: { bank_id: guichet.bank_id, service_id: guichet.service_id }, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/guichet/history/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const waitingTickets = ticketsResponse.data.filter((t) => t.statut === 'attente');
      const treatedTicketsData = ticketsResponse.data.filter((t) => t.statut === 'traite');
      
      setTickets(waitingTickets.map((ticket) => ({ ...ticket, notified: false })).sort((a, b) => (a.position || 9999) - (b.position || 9999)));
      setTreatedTickets(treatedTicketsData.map((ticket) => ({ ...ticket, notified: false })).sort((a, b) => (a.position || 9999) - (b.position || 9999)));
      setHistory(historyResponse.data);
      await fetchStats(activeSousSection);
    } catch (err) {
      handleApiError(err, setError, 'Erreur lors de l’actualisation des données');
    }
  }, [guichet, token, fetchStats, activeSousSection]);

  const deleteTicket = async (ticketId) => {
    const ticket = treatedTickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.statut !== 'traite') {
      toast.error('Seuls les tickets traités peuvent être supprimés.');
      return;
    }
    try {
      await axios.post(`/api/tickets/${ticketId}/delete/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setTreatedTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setHistory((prev) => [{ id: Date.now(), ticket_id: ticketId, ticket_numero: ticket.numero, action: 'supprime', created_at: new Date() }, ...prev.slice(0, 50)]);
      toast.success(`Ticket ${ticket.numero} supprimé`);
      setError('');
    } catch (err) {
      const message = err.response?.status === 404 ? 'Ticket non trouvé ou déjà supprimé.' : err.response?.data?.error || 'Erreur lors de la suppression du ticket';
      setError(message);
      toast.error(message);
      console.error('Erreur API:', err);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (!token) {
      toast.error('Veuillez vous connecter');
      navigate('/login');
      return;
    }
    const fetchGuichetAndUser = async () => {
      setIsLoading(true);
      try {
        const guichetResponse = await axios.get('/api/guichets/me/', { headers: { Authorization: `Bearer ${token}` } });
        const guichetData = guichetResponse.data;
        if (!guichetData) {
          setError('Aucun guichet assigné. Contactez l’administrateur.');
          navigate('/login');
          return;
        }
        setGuichet({
          ...guichetData,
          bank_id: guichetData.bank_id || guichetData.bank?.id,
          service_id: guichetData.service_id || guichetData.service?.id,
        });
        setStatus(guichetData.status || 'closed');
        setAbsentTimer(guichetData.auto_absent_timer || 120);
        const userResponse = await axios.get('/api/users/user/', { headers: { Authorization: `Bearer ${token}` } });
        setUserName(userResponse.data.username || 'Utilisateur');
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) fetchGuichetAndUser();
        } else {
          handleApiError(err, setError, 'Erreur lors du chargement des données');
          navigate('/login');
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };
    fetchGuichetAndUser();
    return () => {
      isMounted.current = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounted');
      }
      clearInterval(countdownTimerRef.current);
    };
  }, [token, navigate, refreshAccessToken]);

  useEffect(() => {
    if (!guichet) return;
    refreshData();
  }, [guichet, token, ticketFilter, refreshData]);

  useEffect(() => {
    if (activeSection === 'statistiques') {
      fetchStats(activeSousSection);
    }
  }, [activeSection, activeSousSection, fetchStats]);

  useEffect(() => {
    if (!guichet || !token || !isMounted.current) return;
    const connectWebSocket = async () => {
      if (connectionLock.current || isConnecting.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) return;
      connectionLock.current = true;
      isConnecting.current = true;
      let currentToken = token;
      if (reconnectAttempts.current > 0) {
        currentToken = await refreshAccessToken();
        if (!currentToken) {
          isConnecting.current = false;
          connectionLock.current = false;
          return;
        }
      }
      const wsUrl = `${WS_BASE_URL}/ws/tickets/?token=${encodeURIComponent(currentToken)}&bank_id=${guichet.bank_id}&service_id=${guichet.service_id}`;
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;
      if (isMounted.current) setWs(websocket);
      websocket.onopen = () => {
        if (!isMounted.current) return;
        isConnecting.current = false;
        connectionLock.current = false;
        reconnectAttempts.current = 0;
        reconnectInterval.current = 5000;
        setError('');
        toast.success('Connexion WebSocket établie');
      };
      websocket.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ticket_update') {
            const ticket = data.ticket;
            const historyAction = data.history_action || ticket.statut;
            if (ticket.statut === 'annule' || ticket.statut === 'absent') {
              setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
              setTreatedTickets((prev) => prev.filter((t) => t.id !== ticket.id));
              if (currentTicket?.id === ticket.id) {
                setCurrentTicket(null); setCountdown(null); setIsPris(false); clearInterval(countdownTimerRef.current);
              }
            } else {
              setTickets((prev) => {
                let updatedTickets = prev.filter((t) => t.id !== ticket.id);
                if (ticket.statut === 'attente') updatedTickets.push({ ...ticket, notified: false });
                return updatedTickets.sort((a, b) => (a.position || 9999) - (b.position || 9999));
              });
              setTreatedTickets((prev) => {
                let updatedTreated = prev.filter((t) => t.id !== ticket.id);
                if (ticket.statut === 'traite') updatedTreated.push({ ...ticket, notified: false });
                return updatedTreated.sort((a, b) => (a.position || 9999) - (b.position || 9999));
              });
            }
            setHistory((prev) => [{ id: Date.now(), ticket_id: ticket.id, ticket_numero: ticket.numero, action: historyAction, created_at: new Date() }, ...prev.slice(0, 50)]);
            if (['traite', 'annule', 'absent'].includes(ticket.statut)) fetchStats(activeSousSection);
            if (ticket.id === currentTicket?.id) {
              setIsPris(ticket.statut === 'traite');
              if (['absent', 'annule', 'traite'].includes(ticket.statut)) {
                setCurrentTicket(null); setCountdown(null); setIsPris(false); clearInterval(countdownTimerRef.current);
              }
            }
          } else if (data.type === 'ticket_delete') {
            setTickets((prev) => prev.filter((t) => t.id !== data.ticket_id));
            setTreatedTickets((prev) => prev.filter((t) => t.id !== data.ticket_id));
            setHistory((prev) => [{ id: Date.now(), ticket_id: data.ticket_id, ticket_numero: data.ticket_numero, action: 'supprime', created_at: new Date() }, ...prev.slice(0, 50)]);
            if (currentTicket?.id === data.ticket_id) {
                setCurrentTicket(null); setCountdown(null); setIsPris(false); clearInterval(countdownTimerRef.current); fetchStats(activeSousSection);
            }
          } else if (data.type === 'guichet_update') {
            setStatus(data.guichet.status);
          } else if (data.type === 'notification_update') {
            toast.info(`Notification: ${data.message}`);
          }
        } catch (err) {
          console.error('Erreur traitement message WebSocket:', err);
          setError('Erreur de traitement des messages WebSocket');
          toast.error('Erreur de traitement des messages WebSocket');
        }
      };
      websocket.onclose = async (event) => {
        if (!isMounted.current) return;
        isConnecting.current = false;
        connectionLock.current = false;
        let errorMessage = `Connexion WebSocket fermée (code: ${event.code})`;
        if (event.code === 4001) {
          const newToken = await refreshAccessToken();
          if (newToken) { connectWebSocket(); return; }
        }
        setError(errorMessage);
        toast.warn(errorMessage);
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectInterval.current + Math.random() * 200;
          reconnectAttempts.current += 1;
          reconnectInterval.current = Math.min(reconnectInterval.current * 2, 30000);
          setTimeout(() => { if (isMounted.current) connectWebSocket(); }, delay);
        } else {
          toast.error('Échec de reconnexion WebSocket.');
          setError('Impossible de maintenir la connexion WebSocket.');
        }
      };
      websocket.onerror = (error) => {
        if (!isMounted.current) return;
        isConnecting.current = false;
        connectionLock.current = false;
        setError('Erreur WebSocket détectée');
        toast.error('Erreur WebSocket détectée.');
        console.error('Erreur WebSocket:', error);
      };
    };
    connectWebSocket();
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounted');
      }
      setWs(null);
      wsRef.current = null;
    };
  }, [guichet, token, WS_BASE_URL, activeSousSection, currentTicket?.id, fetchStats, refreshAccessToken,setWs]);

  const toggleGuichet = async (newStatus) => {
    try {
      await axios.post(`/api/guichet/status/`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setStatus(newStatus);
      toast.success(`Guichet ${newStatus === 'open' ? 'ouvert' : newStatus === 'paused' ? 'en pause' : 'fermé'}`);
    } catch (err) {
      handleApiError(err, setError, 'Erreur lors de la mise à jour du guichet');
    }
  };

  const callTicket = async (ticketId = null) => {
    if (!guichet || status !== 'open') {
      const message = !guichet ? 'Guichet non chargé' : 'Ouvrez le guichet avant d’appeler';
      setError(message);
      toast.error(message);
      return;
    }
    const ticket = ticketId ? tickets.find((t) => t.id === ticketId && t.statut === 'attente') : tickets.find((t) => t.statut === 'attente');
    if (!ticket) {
      setError('Aucun ticket en attente disponible');
      toast.error('Aucun ticket en attente disponible');
      return;
    }
    try {
      const response = await axios.post(`/api/tickets/${ticket.id}/call/`, { custom_message: customMessage }, { headers: { Authorization: `Bearer ${token}` } });
      setCurrentTicket({ ...ticket, ...response.data });
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      setCountdown(absentTimer);
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            markAbsent(ticket.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setCustomMessage('');
      toast.success(`Ticket ${ticket.numero} appelé`);
      setError('');
    } catch (err) {
      handleApiError(err, setError, 'Erreur lors de l’appel du ticket');
    }
  };

  const markPris = async () => {
    if (!currentTicket) return;
    try {
      await axios.post(`/api/tickets/${currentTicket.id}/taken/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsPris(true);
      setCountdown(null);
      clearInterval(countdownTimerRef.current);
      setTreatedTickets((prev) => [...prev, { ...currentTicket, statut: 'traite' }]);
      setHistory((prev) => [{ id: Date.now(), ticket_id: currentTicket.id, ticket_numero: currentTicket.numero, action: 'traite', created_at: new Date() }, ...prev.slice(0, 50)]);
      toast.success(`Ticket ${currentTicket.numero} marqué comme traité`);
      setCurrentTicket(null);
      setError('');
      fetchStats(activeSousSection);
    } catch (err) {
      handleApiError(err, setError, 'Erreur lors du marquage comme traité');
    }
  };

  const markAbsent = async (ticketId) => {
    try {
      await axios.post(`/api/tickets/${ticketId}/absent/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setHistory((prev) => [{ id: Date.now(), ticket_id: ticketId, ticket_numero: currentTicket?.numero || tickets.find((t) => t.id === ticketId)?.numero, action: 'absent', created_at: new Date() }, ...prev.slice(0, 50)]);
      if (currentTicket?.id === ticketId) {
        setCurrentTicket(null); setCountdown(null); setIsPris(false); clearInterval(countdownTimerRef.current);
      }
      toast.success(`Ticket marqué comme absent`);
      setError('');
      fetchStats(activeSousSection);
    } catch (err) {
      handleApiError(err, setError, 'Erreur lors du marquage comme absent');
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const statusColor = {
    attente: 'bg-yellow-100 text-yellow-700',
    traite: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    annule: 'bg-gray-100 text-gray-700',
  };

  const filteredHistory = dateFilter ? history.filter((entry) => new Date(entry.created_at).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()) : history;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-gray-600 text-lg">Chargement...</div>
        <Spiral size="40" speed="0.9" color="blue" />
      </div>
    );
  }

  return (
    <div className="appel-ticket-page">
      <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <div className="mb-6">
          <span className="text-lg font-semibold text-primary-blue">Bonjour {userName}</span>
          <p className="text-sm text-gray-600">Guichet {guichet?.number || 'N/A'} - {guichet?.bank?.name || 'N/A'}</p>
          <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
        </div>
        <nav className="flex-1">
          <button onClick={() => setActiveSection('gestion')} className={`nav-button ${activeSection === 'gestion' ? 'active' : ''}`}>
            <i className="fas fa-users mr-2"></i> Gestion File d'Attente
          </button>
          <button onClick={() => setActiveSection('messages')} className={`nav-button ${activeSection === 'messages' ? 'active' : ''}`}>
            <i className="fas fa-envelope mr-2"></i> Notifier les clients
          </button>
          <button onClick={() => { setActiveSection('statistiques'); setIsStatsSubMenuOpen(!isStatsSubMenuOpen); }} className={`nav-button ${activeSection === 'statistiques' ? 'active' : ''}`}>
            <i className="fas fa-chart-bar mr-2"></i> Statistiques
            <i className={`fas fa-chevron-down submenu-indicator ${isStatsSubMenuOpen ? 'open' : ''}`}></i>
          </button>
          {isStatsSubMenuOpen && activeSection === 'statistiques' && (
            <div className="submenu">
              <button onClick={() => setActiveSousSection('journaliere')} className={`nav-button sub-button ${activeSousSection === 'journaliere' ? 'active' : ''}`}>Journalière</button>
              <button onClick={() => setActiveSousSection('hebdomadaire')} className={`nav-button sub-button ${activeSousSection === 'hebdomadaire' ? 'active' : ''}`}>Hebdomadaire</button>
              <button onClick={() => setActiveSousSection('mensuelle')} className={`nav-button sub-button ${activeSousSection === 'mensuelle' ? 'active' : ''}`}>Mensuelle</button>
            </div>
          )}
          <button onClick={() => setActiveSection('historique')} className={`nav-button ${activeSection === 'historique' ? 'active' : ''}`}>
            <i className="fas fa-history mr-2"></i> Historique des Activités
          </button>
        </nav>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center mt-auto w-full justify-center">
          <i className="fas fa-sign-out-alt mr-2"></i> Déconnexion
        </button>
      </aside>
      <div className="content-wrapper" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
        <header className="headers">
          <button className="hamburger md:hidden" onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} aria-expanded={isSidebarOpen} aria-label={isSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>
            <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'} text-2xl text-primary-blue`}></i>
          </button>
        </header>
        <main className="main">
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8 animate-slide-in flex items-center"><i className="fas fa-exclamation-triangle mr-2"></i> {error}</div>}
          {guichet ? (
            <div>
              {activeSection === 'gestion' && (
                <div className="space-y-8">
                  <div className="card gold-border animate-slide-in">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-semibold text-primary-blue flex items-center">
                          <i className="fas fa-desktop mr-2 text-accent-gold animate-pulse"></i>Guichet {guichet.number}
                        </h1>
                        <p className="text-gray-600">{guichet.service?.name || 'Service non défini'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status === 'open' ? 'bg-green-100 text-green-700' : status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {status === 'open' ? 'Ouvert' : status === 'paused' ? 'En pause' : 'Fermé'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => toggleGuichet('open')} className={`flex-1 ${status === 'open' ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded flex items-center justify-center`} disabled={status === 'open'}><i className="fas fa-lock-open mr-2"></i> Ouvrir</button>
                      <button onClick={() => toggleGuichet('paused')} className={`flex-1 ${status === 'paused' ? 'bg-gray-300' : 'bg-yellow-500 hover:bg-yellow-600'} text-white px-4 py-2 rounded flex items-center justify-center`} disabled={status === 'paused'}><i className="fas fa-pause mr-2"></i> Pause</button>
                      <button onClick={() => toggleGuichet('closed')} className={`flex-1 ${status === 'closed' ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded flex items-center justify-center`} disabled={status === 'closed'}><i className="fas fa-lock mr-2"></i> Fermer</button>
                    </div>
                  </div>
                  <div className="card gold-border animate-slide-in">
                    <h2 className="text-xl font-semibold text-primary-blue mb-4">Client Actuel</h2>
                    {currentTicket ? (
                      <div className="text-center">
                        <p className="text-5xl font-bold text-primary-blue mb-4">{currentTicket.numero}</p>
                        {countdown !== null && <p className="text-red-600 mb-4">Temps restant: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</p>}
                        <div className="flex justify-center space-x-4">
                          {!isPris ? (<><button onClick={() => callTicket(currentTicket.id)} className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center" disabled><i className="fas fa-bullhorn mr-2"></i> Appeler</button><button onClick={markPris} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"><i className="fas fa-check mr-2"></i> Traité</button></>) : (<></>)}
                          <button onClick={() => markAbsent(currentTicket.id)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"><i className="fas fa-user-times mr-2"></i> Absent</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-5xl font-bold text-gray-400 mb-4">---</p>
                        <button onClick={() => callTicket()} className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center mx-auto" disabled={status !== 'open' || tickets.length === 0}><i className="fas fa-bullhorn mr-2"></i> Appeler suivant</button>
                      </div>
                    )}
                    {treatedTickets.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-primary-blue mb-2">Tickets Traités</h3>
                        <div className="space-y-2">{treatedTickets.map((ticket) => (<div key={ticket.id} className="flex justify-between items-center p-2 bg-green-50 rounded"><span>{ticket.numero} - {ticket.service?.name}</span><button onClick={() => deleteTicket(ticket.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Supprimer</button></div>))}</div>
                      </div>
                    )}
                  </div>
                  <div className="card gold-border animate-slide-in">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-primary-blue">Liste des Tickets</h2>
                      <div className="flex space-x-2"><select value={ticketFilter} onChange={(e) => setTicketFilter(e.target.value)} className="border rounded px-2 py-1"><option value="attente">En attente</option><option value="absent">Absent</option><option value="annule">Annulé</option></select><button onClick={refreshData} className="bg-primary-blue text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center"><i className="fas fa-sync-alt mr-2"></i> Actualiser</button></div>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-2">Numéro</th><th className="p-2">Position</th><th className="p-2">Service</th><th className="p-2">Statut</th><th className="p-2">Actions</th></tr></thead><tbody>{tickets.length > 0 ? (tickets.map((ticket) => (<tr key={ticket.id} className="border-b"><td className="p-2">{ticket.numero}</td><td className="p-2">{ticket.position ? `${ticket.position}e` : '-'}</td><td className="p-2">{ticket.service?.name}</td><td className="p-2"><span className={`px-2 py-1 rounded ${statusColor[ticket.statut]}`}>{ticket.statut}</span></td><td className="p-2">{ticket.statut === 'attente' && (<button onClick={() => callTicket(ticket.id)} className="bg-primary-blue text-white px-2 py-1 rounded hover:bg-blue-700" disabled={status !== 'open'}>Appeler</button>)}</td></tr>))) : (<tr><td colSpan="5" className="p-2 text-center text-gray-500">Aucun ticket disponible</td></tr>)}</tbody></table></div>
                  </div>
                </div>
              )}
              {activeSection === 'messages' && (
                <div className="card gold-border animate-slide-in">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-primary-blue mb-2">Notification Générale</h3>
                    <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Message à diffuser à tous les clients..." className="w-full p-2 border rounded" rows="3"></textarea>
                    <button onClick={sendBroadcastNotification} className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700 mt-2 flex items-center"><i className="fas fa-bullhorn mr-2"></i> Diffuser</button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-blue mb-2">Notification Spécifique</h3>
                    <select value={specificTicketId} onChange={(e) => setSpecificTicketId(e.target.value)} className="w-full p-2 border rounded mb-2">
                      <option value="">Sélectionner un ticket</option>
                      {tickets.filter((t) => t.statut === 'attente').map((ticket) => (<option key={ticket.id} value={ticket.id}>{ticket.numero}</option>))}
                    </select>
                    <textarea value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="Message personnalisé pour le ticket sélectionné..." className="w-full p-2 border rounded" rows="3"></textarea>
                    <button onClick={sendSpecificNotification} className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700 mt-2 flex items-center"><i className="fas fa-envelope mr-2"></i> Envoyer</button>
                  </div>
                </div>
              )}
              {activeSection === 'statistiques' && (
                <div className="card gold-border animate-slide-in">
                  <h2 className="text-xl font-semibold text-primary-blue mb-4">Statistiques - {activeSousSection.charAt(0).toUpperCase() + activeSousSection.slice(1)}</h2>
                  <canvas ref={canvasRef} className="w-full h-64 mb-4"></canvas>
                  <div className="text-gray-600 mb-6">
                    <p className="mb-2"><strong>Tickets Traités: </strong> {stats.ticketsProcessed}</p>
                    <p className="mb-2">{activeSousSection === 'journaliere' ? 'Nombre total de tickets traités aujourd’hui.' : activeSousSection === 'hebdomadaire' ? 'Nombre total de tickets traités cette semaine.' : 'Nombre total de tickets traités ce mois-ci.'}</p>
                    <p className="mb-2"><strong>Temps d’Attente Moyen: </strong> {stats.averageWaitTime} minutes</p>
                    <p className="mb-2">{activeSousSection === 'journaliere' ? 'Durée moyenne entre l’appel et le traitement des tickets aujourd’hui.' : activeSousSection === 'hebdomadaire' ? 'Durée moyenne entre l’appel et le traitement des tickets cette semaine.' : 'Durée moyenne entre l’appel et le traitement des tickets ce mois-ci.'}</p>
                    <p className="mb-2"><strong>Taux de Satisfaction: </strong> {stats.satisfactionRate}%</p>
                    <p>Estimation basée sur des données historiques.</p>
                  </div>
                  <div className="mt-4 text-gray-600">
                    <p className="font-semibold">Conseils pour Améliorer Vos Performances:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Utilisez les notifications pour informer les clients des retards.</li>
                      <li>Passez en mode "Pause" pour maintenir votre efficacité.</li>
                      <li>Analysez les pics d’activité pour mieux gérer votre charge.</li>
                      <li>Consultez l’historique pour ajuster vos méthodes.</li>
                    </ul>
                  </div>
                </div>
              )}
              {activeSection === 'historique' && (
                <div className="card gold-border animate-slide-in">
                  <div className="sticky-header">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-primary-blue">Historique</h2>
                      <div className="flex space-x-2 items-center">
                        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border rounded px-2 py-1"/>
                        <button onClick={() => setDateFilter('')} className="bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400 flex items-center"><i className="fas fa-times mr-2"></i> Réinitialiser</button>
                        <button onClick={() => setShowHistory(!showHistory)} className="text-primary-blue hover:underline flex items-center">{showHistory ? (<><i className="fas fa-eye-slash mr-2"></i> Masquer</>) : (<><i className="fas fa-eye mr-2"></i> Afficher</>)}</button>
                      </div>
                    </div>
                  </div>
                  {showHistory && (
                    <div className="table-container">
                      <table className="w-full text-left"><thead><tr className="bg-gray-100"><th className="p-2">Ticket</th><th className="p-2">Action</th><th className="p-2">Date</th></tr></thead><tbody>{filteredHistory.length > 0 ? (filteredHistory.map((entry) => (<tr key={entry.id} className="border-b"><td className="p-2">{entry.ticket_numero}</td><td className="p-2">{entry.action}</td><td className="p-2">{new Date(entry.created_at).toLocaleString()}</td></tr>))) : (<tr><td colSpan="3" className="p-2 text-center text-gray-500">Aucun historique disponible pour cette date</td></tr>)}</tbody></table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : ( <div className="text-center text-gray-500">Chargement des données du guichet...</div> )}
        </main>
      </div>
    </div>
  );
};

export default AppelTicket;