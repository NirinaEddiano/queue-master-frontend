import React, { useState, useEffect, useRef ,useCallback} from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ClientNavbar from './ClientNavbar';
import { Spiral } from 'ldrs/react';
import { QRCodeCanvas } from 'qrcode.react';
import './SuiviTicket.css';

const SuiviTicket = () => {
  const [guichets, setGuichets] = useState([]);
  const [userTickets, setUserTickets] = useState([]);
  const [queueTickets, setQueueTickets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [alertThreshold] = useState(3);
  const [alertedTickets, setAlertedTickets] = useState(new Set());
  const [nowServing, setNowServing] = useState(null);
  const [ticketStatus, setTicketStatus] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const bankIdFromUrl = query.get('bank_id');
  const serviceId = query.get('service_id');
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isMounted = useRef(true);

  const WS_BASE_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8000';

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
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
  }, [navigate]);

  const connectWebSocket = useCallback(async (bankId) => {
    if (!bankId || !isMounted.current) {
      console.log('WebSocket non connecté : paramètres manquants ou composant démonté');
      return;
    }

    let token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Jeton manquant, veuillez vous reconnecter');
      navigate('/login');
      return;
    }

    try {
      await axios.get('/api/users/user/');
    } catch (err) {
      if (err.response?.status === 401) {
        token = await refreshAccessToken();
        if (!token) {
            return;
        }
      } else {
        console.log('Erreur lors de la vérification du token:', err);
        return;
      }
    }

    const wsUrl = serviceId
      ? `${WS_BASE_URL}/ws/tickets/?token=${encodeURIComponent(token)}&bank_id=${bankId}&service_id=${serviceId}`
      : `${WS_BASE_URL}/ws/tickets/?token=${encodeURIComponent(token)}&bank_id=${bankId}`;
    console.log(`Tentative connexion WebSocket: ${wsUrl}`);

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connecté pour bank_id:', bankId, serviceId ? `service_id: ${serviceId}` : 'tous services');
      reconnectAttempts.current = 0;
    };

    wsRef.current.onmessage = (event) => {
      console.log('Message WebSocket reçu:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connection_established') {
        } else if (data.type === 'ticket_update' && isMounted.current) {
          const ticket = data.ticket;
          const ticketUser = typeof ticket.user === 'string' ? ticket.user.replace(/\s*\(Client\)/, '') : ticket.user?.username || 'Client';
          const isUserTicket = ticketUser === currentUser;

          if (!ticket.position && ticket.statut === 'attente') {
            console.warn(`Ticket ${ticket.numero} reçu sans position, définissant à 9999 temporairement`);
            ticket.position = 9999;
          }

          setTicketStatus((prev) => ({
            ...prev,
            [ticket.id]: ticket.statut,
          }));

          if (ticket.statut === 'annule') {
            setUserTickets((prev) => prev.filter((t) => t.id !== ticket.id));
            setQueueTickets((prev) => prev.filter((t) => t.id !== ticket.id));
            setAlertedTickets((prev) => {
              const newSet = new Set(prev);
              newSet.delete(ticket.id);
              return newSet;
            });
          } else {
            if (isUserTicket) {
              setUserTickets((prev) => {
                const updated = prev.filter((t) => t.id !== ticket.id);
                return [...updated, ticket].sort((a, b) => (a.position || 9999) - (b.position || 9999));
              });
            }

            setQueueTickets((prev) => {
              const updated = prev.filter((t) => t.id !== ticket.id);
              return [...updated, ticket].sort((a, b) => {
                if (a.statut === 'traite' && b.statut !== 'traite') return -1;
                if (a.statut !== 'traite' && b.statut === 'traite') return 1;
                return (a.position || 9999) - (b.position || 9999);
              });
            });

            const guichet = guichets.find((g) => g.service.id === ticket.service.id);
            if (isUserTicket && guichet?.status === 'open' && ticket.position <= alertThreshold && !alertedTickets.has(ticket.id) && ticket.statut === 'attente') {
              const message = `Alerte : votre tour approche (${ticket.position} tickets restants) pour ${ticket.service.name} !`;
              toast.warn(message);
              setAlertedTickets((prev) => new Set(prev).add(ticket.id));
            }
          }

          if (ticket.statut === 'traite') {
            setNowServing({ ...ticket, service: ticket.service || { name: 'N/A' } });
            setTimeout(() => setNowServing(null), 5000);
          }
        } else if (data.type === 'ticket_delete' && isMounted.current) {
          setUserTickets((prev) => prev.filter((t) => t.id !== data.ticket_id));
          setQueueTickets((prev) => prev.filter((t) => t.id !== data.ticket_id));
          setAlertedTickets((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.ticket_id);
            return newSet;
          });
          setTicketStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[data.ticket_id];
            return newStatus;
          });
          setNowServing({ numero: data.ticket_numero, service: { name: 'N/A' } });
          setTimeout(() => setNowServing(null), 5000);
        } else if (data.type === 'guichet_update' && isMounted.current) {
          setGuichets((prev) =>
            prev.map((g) => (g.id === data.guichet.id ? { ...g, status: data.guichet.status } : g))
          );
        } else if (data.type === 'notification_update') {
          toast.info(`Notification: ${data.message}`);
        } else if (data.type === 'heartbeat') {
          console.log('Heartbeat received:', data.message);
        }
      } catch (err) {
        console.error('Erreur traitement message WebSocket:', err);
        toast.error('Erreur de traitement des messages WebSocket');
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      toast.error('Erreur de connexion WebSocket');
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket déconnecté:', { code: event.code, reason: event.reason });
      if (isMounted.current && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        console.log(`Tentative de reconnexion ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        setTimeout(() => connectWebSocket(bankId), 5000);
      } else if (isMounted.current) {
        toast.error('Connexion WebSocket perdue, veuillez rafraîchir la page');
      }
    };
  }, [navigate, serviceId, WS_BASE_URL, currentUser, guichets, alertThreshold, alertedTickets, refreshAccessToken]);

  useEffect(() => {
    isMounted.current = true;
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Veuillez vous connecter');
      navigate('/login');
      return;
    }

    const fetchData = async (isInitial = false) => {
      if (isInitial) {
        setIsInitialLoading(true);
      }

      try {
        let username;
        try {
          const userResponse = await axios.get('/api/users/user/');
          username = userResponse.data.username;
          if (isMounted.current) {
            setCurrentUser(username);
          }
        } catch (userErr) {
          console.error('Erreur utilisateur:', userErr);
          throw userErr;
        }

        let ticketData = [];
        let historyData = [];
        try {
          const [ticketsResponse, historyResponse] = await Promise.all([
            axios.get('/api/tickets/list/?user_only=true'),
            axios.get('/api/tickets/history/'),
          ]);
          ticketData = ticketsResponse.data || [];
          historyData = historyResponse.data;
          console.log('Tickets utilisateur reçus:', ticketData);
        } catch (ticketErr) {
          console.error('Erreur lors du chargement des tickets:', ticketErr);
          if (isMounted.current) {
            setError('Impossible de charger vos tickets. Veuillez réessayer.');
          }
          return;
        }

        let bankIds = bankIdFromUrl ? [bankIdFromUrl] : [...new Set(ticketData.map((t) => t.bank.id))];
        let queueData = [];
        let guichetsData = [];

        if (ticketData.length > 0) {
          const serviceIds = [...new Set(ticketData.map((ticket) => ticket.service.id))];
          try {
            for (const bankId of bankIds) {
              for (const serviceId of serviceIds) {
                const queueResponse = await axios.get('/api/tickets/list/', {
                  params: { bank_id: bankId, service_id: serviceId },
                });
                queueData = [...queueData, ...queueResponse.data];
              }
            }
            console.log('Tickets de la file reçus:', queueData);
          } catch (queueErr) {
            console.error('Erreur lors du chargement des files:', queueErr);
          }

          try {
            for (const bankId of bankIds) {
              const guichetResponse = await axios.get('/api/guichets/', {
                params: { bank_id: bankId, service_ids: serviceIds.join(',') },
              });
              guichetsData = [...guichetsData, ...(guichetResponse.data || [])];
            }
            console.log('Guichets reçus:', guichetsData);
            if (isMounted.current) {
              setGuichets(guichetsData);
            }
          } catch (guichetErr) {
            console.error('Erreur lors du chargement des guichets:', guichetErr);
          }
        }

        const excludedTicketIds = new Set(
          historyData
            .filter((entry) => entry.action === 'annule')
            .map((entry) => entry.ticket_id)
        );

        if (isMounted.current) {
          const filteredTicketData = ticketData.filter((ticket) => !excludedTicketIds.has(ticket.id));
          const filteredQueueData = queueData.sort((a, b) => {
            if (a.statut === 'traite' && b.statut !== 'traite') return -1;
            if (a.statut !== 'traite' && b.statut === 'traite') return 1;
            return (a.position || 9999) - (b.position || 9999);
          });
          setUserTickets(filteredTicketData);
          setQueueTickets(filteredQueueData);
          setTicketStatus({});
          setError(filteredTicketData.length === 0 ? 'Vous n’avez aucun ticket actif.' : '');
        }

        ticketData.forEach((ticket) => {
          const guichet = guichetsData.find((g) => g.service.id === ticket.service.id);
          if (guichet?.status === 'open' && ticket.position <= alertThreshold && !alertedTickets.has(ticket.id) && !excludedTicketIds.has(ticket.id) && ticket.statut === 'attente') {
            const message = `Alerte : votre tour approche (${ticket.position} tickets restants) pour ${ticket.service.name} !`;
            toast.warn(message);
            setAlertedTickets((prev) => new Set(prev).add(ticket.id));
          }
        });

        if (isInitial && bankIds.length > 0) {
          bankIds.forEach((bankId) => connectWebSocket(bankId));
        }
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Session expirée, veuillez vous reconnecter');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        } else if (isMounted.current) {
          setError('Erreur lors du chargement des données.');
          toast.error('Erreur lors du chargement des données');
        }
      } finally {
        if (isInitial) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);

    return () => {
      isMounted.current = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Composant démonté');
      }
      clearInterval(interval);
    };
  }, [navigate, bankIdFromUrl, serviceId, alertThreshold, alertedTickets, connectWebSocket]);

  const handleCancel = async (ticketId) => {
    try {
      setUserTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setQueueTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setAlertedTickets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
      setTicketStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[ticketId];
        return newStatus;
      });

      const response = await axios.post(`/api/tickets/${ticketId}/cancel/`);
      if (response.status === 200) {
        toast.success('Ticket annulé avec succès');
      }
    } catch (err) {
      console.error('Erreur lors de l’annulation:', err);
      try {
        const ticketResponse = await axios.get('/api/tickets/list/?user_only=true');
        const ticketData = ticketResponse.data || [];
        const excludedTicketIds = new Set(
          (await axios.get('/api/tickets/history/')).data
            .filter((entry) => entry.action === 'annule')
            .map((entry) => entry.ticket_id)
        );
        setUserTickets(ticketData.filter((ticket) => !excludedTicketIds.has(ticket.id)));
        if (!ticketData.some((t) => t.id === ticketId && t.statut === 'attente')) {
          toast.success('Ticket annulé avec succès');
        } else {
          setError('Erreur lors de l’annulation. Veuillez réessayer.');
          toast.error('Erreur lors de l’annulation');
        }
      } catch (fetchErr) {
        setError('Erreur lors du rechargement des tickets.');
        toast.error('Erreur lors du rechargement des tickets');
      }
    }
  };

  const toggleQRCode = (ticketId) => {
    setShowQRCode(ticketId === showQRCode ? null : ticketId);
  };

  if (isInitialLoading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600 text-lg mr-4">Chargement...</div>
          <Spiral size="40" speed="0.9" color={getComputedStyle(document.documentElement).getPropertyValue('--primary-blue')} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`container ${showQRCode ? 'filter blur-sm' : ''}`}>
        <ClientNavbar />
        <main className="main">
          <h1 className="text-2xl font-bold text-primary-blue mb-6 animate-slide-in flex items-center">
            <i className="fas fa-ticket-alt mr-2 text-accent-gold animate-pulse"></i> Mes Files d’Attente
          </h1>
          {nowServing && (
            <div className="now-serving animate-slide-in">
              <h2 className="text-xl font-semibold flex items-center">
                <i className="fas fa-bullhorn mr-2 animate-pulse"></i> Maintenant servi : Ticket {nowServing.numero}
              </h2>
              <p className="text-lg">Service : {nowServing.service.name}</p>
            </div>
          )}
          <div className="card gold-border mb-6 animate-slide-in">
            <h2 className="text-xl font-semibold text-primary-blue mb-4 flex items-center">
              <i className="fas fa-info-circle mr-2 text-accent-gold animate-pulse"></i> Guide
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-primary-blue mb-2 flex items-center">
                <i className="fas fa-list-ol mr-2"></i> Étape 6 : Suivez votre position
              </h3>
              <p className="text-gray-600">
                Votre position dans la file est mise à jour en temps réel. Une alerte apparaîtra lorsque vous serez proche de votre tour.
              </p>
              <p className="text-primary-blue mt-2 flex items-center">
                <i className="fas fa-lightbulb mr-1"></i> <strong>Astuce :</strong> Planifiez une visite future via <em>Rendez-vous</em>.
              </p>
            </div>
          </div>
          {error && (
            <div className="error-message animate-slide-in">
              <i className="fas fa-exclamation-triangle mr-2"></i> {error}
            </div>
          )}
          {userTickets.length === 0 && !error ? (
            <div className="card gold-border animate-slide-in">
              <p className="text-gray-600 flex items-center">
                <i className="fas fa-ticket-alt mr-2 text-primary-blue"></i> Vous n’avez aucun ticket actif.
              </p>
            </div>
          ) : (
            userTickets.map((ticket) => {
              const guichet = guichets.find((g) => g.service.id === ticket.service.id);
              const position = ticket.position || queueTickets.findIndex((t) => t.id === ticket.id) + 1;
              const serviceQueue = queueTickets
                .filter((t) => t.service.id === ticket.service.id && t.bank.id === ticket.bank.id)
                .sort((a, b) => {
                  if (a.statut === 'traite' && b.statut !== 'traite') return -1;
                  if (a.statut !== 'traite' && b.statut === 'traite') return 1;
                  return (a.position || 9999) - (b.position || 9999);
                });
              const progress = Math.max(0, 100 - (position / (serviceQueue.length || 1)) * 100);
              const displayStatus = ticketStatus[ticket.id] || ticket.statut;

              return (
                <div key={ticket.id} className="card gold-border animate-slide-in">
                  <h2 className="text-xl font-semibold text-primary-blue mb-4 flex items-center">
                    <i className="fas fa-users mr-2 text-accent-gold animate-pulse"></i>
                    File d’attente - {ticket.service.name} ({ticket.bank.name}) {guichet ? `(Guichet ${guichet.number})` : ''}
                  </h2>
                  <div className="mb-4">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="font-medium text-primary-blue flex items-center">
                          <i className="fas fa-desktop mr-2"></i> Guichet {guichet?.number || 'Non assigné'}
                        </p>
                        <p className="text-gray-600">{ticket.service.name}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          guichet?.status === 'open'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {guichet?.status ? guichet.status.charAt(0).toUpperCase() + guichet.status.slice(1) : 'Inconnu'}
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-primary-blue mb-2">Votre ticket</h3>
                    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-lg ${displayStatus === 'traite' ? 'bg-green-100' : ''}`}>
                      <div className="mb-4 sm:mb-0">
                        <p className="font-medium text-primary-blue">Ticket: {ticket.numero}</p>
                        <p className="text-gray-600">
                          Statut:{' '}
                          <span
                            className={`font-semibold ${
                              displayStatus === 'traite' ? 'text-green-600' : 'text-yellow-600'
                            }`}
                          >
                            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          </span>
                        </p>
                        <p className="text-gray-600">Position: {position}</p>
                        <p className="text-gray-600">Tickets restants: {serviceQueue.length}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        {displayStatus === 'attente' && (
                          <>
                            <button
                              onClick={() => toggleQRCode(ticket.id)}
                              className="ticket-button"
                              aria-label={`Afficher le QR code pour le ticket ${ticket.numero}`}
                            >
                              <i className="fas fa-qrcode mr-2"></i> Afficher QR Code
                            </button>
                            <button
                              onClick={() => handleCancel(ticket.id)}
                              className="cancel-button"
                              aria-label={`Annuler le ticket ${ticket.numero}`}
                            >
                              <i className="fas fa-times mr-2"></i> Annuler
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-blue mb-2">Progression de la file</h3>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 mt-2">
                      {progress.toFixed(0)}% complété ({position} tickets restants)
                    </p>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-primary-blue mb-2">File d’attente complète</h3>
                    {serviceQueue.length === 0 ? (
                      <p className="text-gray-600">Aucun ticket dans la file.</p>
                    ) : (
                      <div className="space-y-4">
                        {serviceQueue.map((queueTicket) => (
                          <div
                            key={queueTicket.id}
                            className={`p-4 rounded-lg border ${
                              queueTicket.statut === 'traite' ? 'bg-green-100' : 'bg-gray-50'
                            }`}
                          >
                            <p className="font-semibold text-primary-blue">
                              Ticket {queueTicket.numero} - {queueTicket.service.name}
                            </p>
                            <p className="text-gray-600">
                              Client: {queueTicket.user.username === currentUser ? currentUser : 'Client'}
                            </p>
                            <p className="text-gray-600">
                              Position: {queueTicket.position != null ? `${queueTicket.position}e` : 'Calcul en cours...'}
                            </p>
                            <p className="text-gray-600">
                              Statut: {queueTicket.statut === 'attente' ? 'En attente' : 'Traité'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>

      {showQRCode && (
        <div className="qr-code-overlay">
          <div className="qr-code-container">
            <h3 className="text-lg font-semibold text-primary-blue mb-4">Votre QR Code</h3>
            {userTickets.map((ticket) =>
              ticket.id === showQRCode ? (
                <div key={ticket.id} className="flex flex-col items-center">
                  <QRCodeCanvas value={ticket.numero} size={200} />
                  <p className="mt-4 text-gray-600">Montrez ce QR code au guichet</p>
                  <button
                    onClick={() => toggleQRCode(ticket.id)}
                    className="ticket-button"
                    aria-label={`Masquer le QR code pour le ticket ${ticket.numero}`}
                  >
                    <i className="fas fa-eye-slash mr-2"></i> Masquer QR Code
                  </button>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SuiviTicket;