import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ClientNavbar from './ClientNavbar';
import BordDroite from './BordDroite';
import './Profil.css';

const Profil = () => {
  const [userData, setUserData] = useState(null);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Veuillez vous connecter');
        navigate('/login');
        return;
      }

      try {
        const userResponse = await axios.get('/api/users/user/');
        setUserData(userResponse.data);
        setFormData({
          username: userResponse.data.username,
          email: userResponse.data.email || '',
          phone: userResponse.data.phone || '',
          address: userResponse.data.address || '',
        });
        const imageUrl = userResponse.data.profile_image
          ? userResponse.data.profile_image.startsWith('http')
            ? userResponse.data.profile_image
            : `http://localhost:8000${userResponse.data.profile_image}`
          : '';
        setImagePreview(imageUrl);

        try {
          const ticketResponse = await axios.get('/api/tickets/history/');
          setTicketHistory(ticketResponse.data || []);
        } catch (ticketErr) {
          if (ticketErr.response?.status === 404) {
            setTicketHistory([]);
          } else {
            throw ticketErr;
          }
        }

        try {
          const notificationResponse = await axios.get('/api/notifications/');
          setNotifications(notificationResponse.data || []);
        } catch (notificationErr) {
          if (notificationErr.response?.status === 404) {
            setNotifications([]);
          } else {
            throw notificationErr;
          }
        }

        try {
          const appointmentResponse = await axios.get('/api/appointments/list/');
          setAppointments(appointmentResponse.data || []);
        } catch (appointmentErr) {
          if (appointmentErr.response?.status === 404) {
            setAppointments([]);
          } else {
            throw appointmentErr;
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Session expirée, veuillez vous reconnecter');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/login');
        } else {
          setError('Une erreur est survenue lors du chargement des données');
          toast.error('Erreur de connexion au serveur');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Veuillez entrer un email valide');
      return;
    }
    try {
      const updateData = new FormData();
      updateData.append('username', formData.username);
      updateData.append('email', formData.email);
      updateData.append('phone', formData.phone);
      updateData.append('address', formData.address);
      if (profileImage) {
        updateData.append('profile_image', profileImage);
      }

      const response = await axios.put('/api/users/update/', updateData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUserData(response.data);
      const imageUrl = response.data.profile_image
        ? response.data.profile_image.startsWith('http')
          ? response.data.profile_image
          : `http://localhost:8000${response.data.profile_image}`
        : '';
      setImagePreview(imageUrl);
      setEditMode(false);
      setProfileImage(null);
      toast.success('Profil mis à jour avec succès');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du profil');
      setError('Impossible de mettre à jour le profil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    try {
      await axios.post('/api/users/change-password/', passwordData);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Mot de passe changé avec succès');
    } catch (err) {
      toast.error('Erreur lors du changement de mot de passe');
      setError('Impossible de changer le mot de passe');
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer votre historique de tickets et notifications ?')) {
      try {
        await axios.delete('/api/history/clear/');
        setTicketHistory([]);
        setNotifications([]);
        toast.success('Historique et notifications supprimés avec succès');
      } catch (err) {
        toast.error('Erreur lors de la suppression de l’historique');
        setError('Impossible de supprimer l’historique');
      }
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <i className="fas fa-spinner fa-spin text-4xl text-accent-gold"></i>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="profil-container">
      <ClientNavbar />
      <main className="profil-content">
        {/* Profile Header */}
        <div className="card gold-border mb-8 p-6 animate-slide-in">
          <div className="flex flex-col items-center">
            <div className="profil-image-container">
              <img
                src={imagePreview || 'https://via.placeholder.com/150'}
                alt="Profile"
                className="profil-image"
              />
              {editMode && (
                <label className="profil-image-upload">
                  <i className="fas fa-camera"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className='contact'>
            <h1 >{userData.username}</h1>
            <p >{userData.email || 'Non défini'}</p>
            </div>
          </div>
        </div>

        {/* Horizontal Menu */}
        <div className="profil-menu-horizontal">
          {[
            { id: 'profile', label: 'Profil', icon: 'fas fa-user' },
            { id: 'password', label: 'Mot de passe', icon: 'fas fa-lock' },
            { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell', badge: unreadNotifications },
            { id: 'appointments', label: 'Rendez-vous', icon: 'fas fa-calendar-alt' },
            { id: 'history', label: 'Historique', icon: 'fas fa-history' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`profil-menu-horizontal-button ${activeSection === item.id ? 'active' : ''}`}
            >
              <i className={`${item.icon} mr-2`}></i>
              {item.label}
              {item.badge > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-500 mb-6 p-4 bg-red-50 rounded-lg animate-slide-in flex items-center">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          </p>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="card gold-border mb-8 animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-info-circle mr-2 text-accent-gold animate-pulse"></i> Informations Personnelles
            </h2>
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-primary-blue mb-2 font-medium flex items-center">
                    <i className="fas fa-user mr-2 text-accent-turquoise"></i> Nom d’utilisateur
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                  />
                </div>
                <div>
                  <label className="block text-primary-blue mb-2 font-medium flex items-center">
                    <i className="fas fa-envelope mr-2 text-accent-turquoise"></i> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                  />
                </div>
                <div>
                  <label className="block text-primary-blue mb-2 font-medium flex items-center">
                    <i className="fas fa-phone mr-2 text-accent-turquoise"></i> Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                  />
                </div>
                <div>
                  <label className="block text-primary-blue mb-2 font-medium flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-accent-turquoise"></i> Adresse
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setEditMode(false)}
                    className="secondary-button w-1/2 flex items-center justify-center"
                  >
                    <i className="fas fa-times mr-2"></i> Annuler
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="cta-button w-1/2 flex items-center justify-center"
                  >
                    <i className="fas fa-save mr-2"></i> Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 px-60">
                <p className="text-gray-600 flex items-center">
                  <i className="fas fa-user mr-2 text-accent-turquoise"></i> <strong>Nom d’utilisateur :</strong>{' '}
                  {userData.username}
                </p>
                <p className="text-gray-600 flex items-center">
                  <i className="fas fa-envelope mr-2 text-accent-turquoise"></i> <strong>Email :</strong>{' '}
                  {userData.email || 'Non défini'}
                </p>
                <p className="text-gray-600 flex items-center">
                  <i className="fas fa-phone mr-2 text-accent-turquoise"></i> <strong>Téléphone :</strong>{' '}
                  {userData.phone || 'Non défini'}
                </p>
                <p className="text-gray-600 flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-accent-turquoise"></i> <strong>Adresse :</strong>{' '}
                  {userData.address || 'Non défini'}
                </p>
                <p className="text-gray-600 flex items-center">
                  <i className="fas fa-user-tag mr-2 text-accent-turquoise"></i> <strong>Rôle :</strong>{' '}
                  {userData.role}
                </p>
                <button
                  onClick={() => setEditMode(true)}
                  className="cta-button mt-4 flex items-center"
                >
                  <i className="fas fa-edit mr-2"></i> Modifier le Profil
                </button>
              </div>
            )}
          </div>
        )}

        {/* Change Password Section */}
        {activeSection === 'password' && (
          <div className="card gold-border mb-8 animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-lock mr-2 text-accent-gold animate-pulse"></i> Changer le Mot de Passe
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-primary-blue mb-2 font-medium flex items-center">
                  <i className="fas fa-key mr-2 text-accent-turquoise"></i> Mot de passe actuel
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                />
              </div>
              <div>
                <label className="block text-primary-blue mb-2 font-medium flex items-center">
                  <i className="fas fa-key mr-2 text-accent-turquoise"></i> Nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                />
              </div>
              <div>
                <label className="block text-primary-blue mb-2 font-medium flex items-center">
                  <i className="fas fa-key mr-2 text-accent-turquoise"></i> Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="cta-button flex items-center"
              >
                <i className="fas fa-lock mr-2"></i> Changer le Mot de Passe
              </button>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <div className="card gold-border mb-8 animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-bell mr-2 text-accent-gold animate-pulse"></i> Notifications Récentes
              {unreadNotifications > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadNotifications}
                </span>
              )}
            </h2>
            {notifications.length > 0 ? (
              <ul className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <li
                    key={notification.id}
                    className="border-b py-2 text-gray-600 animate-slide-in flex items-center"
                  >
                    <i className="fas fa-bell mr-2 text-accent-turquoise"></i> {notification.message} -{' '}
                    {new Date(notification.created_at).toLocaleDateString()}
                    {!notification.read && <span className="ml-2 text-accent-gold">• Nouveau</span>}
                  </li>
                ))}
                <Link
                  to="/notifications"
                  className="text-accent-turquoise hover:underline flex items-center"
                >
                  <i className="fas fa-arrow-right mr-2"></i> Voir toutes les notifications
                </Link>
              </ul>
            ) : (
              <p className="text-gray-600 flex items-center">
                <i className="fas fa-bell-slash mr-2 text-accent-turquoise"></i> Aucune notification récente.
              </p>
            )}
          </div>
        )}

        {/* Appointments Section */}
        {activeSection === 'appointments' && (
          <div className="card gold-border mb-8 animate-slide-in">
            <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center px-40">
              <i className="fas fa-calendar-alt mr-2 text-accent-gold animate-pulse"></i> Rendez-vous à Venir
            </h2>
            {appointments.length > 0 ? (
              <ul className="space-y-2">
                {appointments.slice(0, 3).map((appointment) => (
                  <li
                    key={appointment.id}
                    className="border-b py-2 text-gray-600 animate-slide-in flex items-center"
                  >
                    <i className="fas fa-calendar-check mr-2 text-accent-turquoise"></i>
                    {appointment.service?.name || 'Service inconnu'} à{' '}
                    {appointment.bank?.name || 'Banque inconnue'} -{' '}
                    {new Date(appointment.date_time).toLocaleString()}
                  </li>
                ))}
                <Link
                  to="/rendez-vous"
                  className="text-accent-turquoise hover:underline flex items-center"
                >
                  <i className="fas fa-arrow-right mr-2"></i> Voir tous les rendez-vous
                </Link>
              </ul>
            ) : (
              <p className="text-gray-600 flex items-center">
                <i className="fas fa-calendar-times mr-2 text-accent-turquoise"></i> Aucun rendez-vous à venir.
              </p>
            )}
          </div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <div className="card gold-border mb-8 animate-slide-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-primary-blue flex items-center px-40">
                <i className="fas fa-history mr-2 text-accent-gold animate-pulse"></i> Historique des Tickets
              </h2>
              <button
                onClick={handleClearHistory}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center"
              >
                <i className="fas fa-trash-alt mr-2"></i> Supprimer l’historique
              </button>
            </div>
            {ticketHistory.length > 0 ? (
              <ul className="space-y-2">
                {ticketHistory.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="border-b py-2 text-gray-600 animate-slide-in flex items-center"
                  >
                    <i className="fas fa-ticket-alt mr-2 text-accent-turquoise"></i>
                    <strong>Ticket {ticket.numero}</strong> - {ticket.service?.name || 'Service inconnu'} à{' '}
                    {ticket.bank?.name || 'Banque inconnue'} - Statut : {ticket.statut} -{' '}
                    {new Date(ticket.date_heure).toLocaleDateString()}
                    {ticket.sub_category && (
                      <>
                        <br />
                        <span className="text-sm flex items-center">
                          <i className="fas fa-list mr-2 text-accent-turquoise"></i> Motif : {ticket.sub_category}
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 flex items-center">
                <i className="fas fa-ticket-alt mr-2 text-accent-turquoise"></i> Aucun ticket trouvé dans votre historique.
              </p>
            )}
          </div>
        )}
      </main>
      <BordDroite />
    </div>
  );
};

export default Profil;