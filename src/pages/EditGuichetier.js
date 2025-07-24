import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './styles.css';

const EditGuichetier = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    console.log('Guichetier ID from useParams:', id); // Debug log
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }

    if (!id || id === 'undefined' || isNaN(id)) {
      setError(`ID du guichetier non valide: ${id}`);
      navigate('/admin');
      return;
    }

    axios
      .get(`http://localhost:8000/guichetier/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUsername(response.data.username);
        setEmail(response.data.email || '');
      })
      .catch((err) => {
        setError('Erreur lors de la récupération des données: ' + (err.response?.data?.error || err.message));
      });
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Session expirée. Veuillez vous reconnecter.');
      navigate('/login');
      return;
    }

    if (!id || id === 'undefined' || isNaN(id)) {
      setError(`ID du guichetier non valide: ${id}`);
      navigate('/admin');
      return;
    }

    try {
      const data = { username, email };
      if (password) data.password = password;
      await axios.put(`http://localhost:8000/guichetier/${id}/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/admin');
    } catch (err) {
      setError('Erreur lors de la mise à jour du guichetier: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <div className="card gold-border p-8 max-w-md w-full animate-slide-in">
        <button
          onClick={() => navigate('/admin')}
          className="text-primary-blue mb-4 flex items-center"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Retour
        </button>
        <h2 className="text-2xl font-semibold text-primary-blue mb-6 flex items-center">
          <FontAwesomeIcon icon={faUser} className="mr-2" />
          Modifier un Guichetier
        </h2>
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              />
              <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              />
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe (facultatif)
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Laissez vide pour ne pas modifier"
              />
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition-colors"
          >
            Mettre à jour
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditGuichetier;