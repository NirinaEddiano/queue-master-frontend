import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import './ClientNavbar.css';

const ClientNavbar = () => {
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/users/user/');
        setUsername(response.data.username);
        const imageUrl = response.data.profile_image
          ? response.data.profile_image.startsWith('http')
            ? response.data.profile_image
            : `http://localhost:8000${response.data.profile_image}`
          : 'https://via.placeholder.com/40';
        setProfileImage(imageUrl);
      } catch (err) {
        console.error('Erreur récupération utilisateur:', err);
        toast.error('Erreur lors du chargement du profil');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
    toast.success('Déconnexion réussie');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="client-navbar">
        <div className="navbar-brand">
          <span className="brand-title">
            <i className="fas fa-ticket-alt mr-2 text-accent-gold"></i> QueueMaster
          </span>
          <button
            className="burger-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
        <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          {[
            { path: '/home', label: 'Accueil', icon: 'fas fa-home' },
            { path: '/profil', label: 'Profil', icon: 'fas fa-user' },
            { path: '/suivi-ticket', label: 'File d’attente', icon: 'fas fa-list-ul' },
            { path: '/notifications', label: 'Notifications', icon: 'fas fa-bell' },
            { path: '/rendez-vous', label: 'Rendez-vous', icon: 'fas fa-calendar-alt' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMenuOpen(false);
              }}
              className={`navbar-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <i className={`${item.icon} mr-2 text-accent-gold`}></i> {item.label}
            </button>
          ))}
          <div className="navbar-footer">
            <div className="profile-container">
              <img
                src={profileImage}
                alt="Profile"
                className="profile-image"
              />
               <span className="profile-name">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-button"
            >
              <i className="fas fa-sign-out-alt mr-2 text-accent-gold"></i> Déconnexion
            </button>
          </div>
        </div>
      </nav>
      <div
        className={`overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>
    </>
  );
};

export default ClientNavbar;