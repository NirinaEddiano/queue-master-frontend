import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import ClientNavbar from './ClientNavbar';
import BordDroite from './BordDroite';
import './styles.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/notifications/');
        setNotifications(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des notifications.');
        toast.error('Erreur lors du chargement des notifications');
      }
    };
    fetchNotifications();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}/delete/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification supprimée');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteAll = async () => {
    try {
      await axios.delete('/api/notifications/all/');
      setNotifications([]);
      toast.success('Toutes les notifications supprimées');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <ClientNavbar />
      <main className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold text-primary-blue flex items-center">
            <i className="fas fa-bell mr-2 text-accent-gold animate-pulse"></i> Notifications
          </h1>
          
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8 animate-slide-in">
            {error}
          </div>
        )}
        {notifications.length === 0 ? (
          <div className="card gold-border animate-slide-in">
            <p className="text-gray-600">Aucune notification.</p>
          </div>
        ) : (
          <div className="card gold-border animate-slide-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-primary-blue flex items-center">
                <i className="fas fa-bell mr-2 text-accent-gold animate-pulse"></i> Vos Notifications
              </h2>
              <button
                onClick={handleDeleteAll}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Supprimer tout
              </button>
            </div>
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="flex justify-between items-center p-4 bg-bg-light rounded-lg shadow-sm animate-slide-in"
                >
                  <div>
                    <p className="font-medium text-primary-blue">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <BordDroite />
    </div>
  );
};

export default Notifications;