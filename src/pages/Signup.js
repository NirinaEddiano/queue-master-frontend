import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './signup.css'; 
import signupIllustration from '../assets/images/signup-illustration.png';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      toast.error('Mot de passe trop court');
      return;
    }
    try {
      await axios.post('http://localhost:8000/api/users/register/', {
        username,
        password,
        role: 'client',
      });
      toast.success('Inscription réussie ! Connectez-vous maintenant.');
      navigate('/login');
    } catch (err) {
      const errorMessage =
        err.response?.data?.username?.[0] || 
        err.response?.data?.detail ||
        'Erreur lors de l’inscription';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="signup-page-container">
      <Link to="/" className="back-button1">
              Retour
            </Link>
      <div className="signup-card">
        <div className="panel-left">
          <h2>Déjà parmi nous ?</h2>
          <p>
            Connectez-vous pour accéder à votre espace et continuer votre aventure.
          </p>
          <Link to="/login" className="btn btn-outline">
            Se Connecter
          </Link>
          <img src={signupIllustration} alt="Illustration de fusée" className="illustration" />
        </div>

        <div className="panel-right">
          <form onSubmit={handleSubmit} className="form-container" noValidate>
            <h1 className="form-title">Créer un compte</h1>

            {error && <p className="error-message">{error}</p>}
            
            <div className="input-wrapper">
              <i className="fas fa-user input-icon"></i>
              <input
                id="username"
                type="text"
                placeholder="Nom d’utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <i className="fas fa-lock input-icon"></i>
              <input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'} 
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FontAwesomeIcon
                icon={isPasswordVisible ? faEyeSlash : faEye}
                className="password-toggle-icon"
                onClick={togglePasswordVisibility}
              />
            </div>

            <button type="submit" className="btn btn-solid">
              S’inscrire
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;