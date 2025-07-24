import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './Login.css';
import loginIllustration from '../assets/images/login-illustration.png';

const Login = () => {
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
    try {
      const tokenResponse = await axios.post('http://localhost:8000/api/token/', {
        username,
        password,
      });
      console.log('Token Response:', tokenResponse.data);
      localStorage.setItem('access_token', tokenResponse.data.access);
      localStorage.setItem('refresh_token', tokenResponse.data.refresh);

      const userResponse = await axios.get('http://localhost:8000/api/users/user/', {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access}`,
        },
      });
      console.log('User Response:', userResponse.data);

      toast.success('Connexion réussie !');
      const role = userResponse.data.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'guichetier') navigate('/appel-ticket');
      else navigate('/home');
    } catch (err) {
      console.error('Login Error:', err);
      const errorMessage =
        err.response?.status === 401
          ? 'Identifiants incorrects'
          : err.response?.data?.detail || 'Erreur de connexion';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="login-page-container">
      <Link to="/" className="back-button1">
        Retour
      </Link>
      <div className="login-card">

        <div className="panel-form">
          <form onSubmit={handleSubmit} className="form-container" noValidate>
            <h1 className="form-title">Connexion</h1>
            
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
              Se Connecter
            </button>
          </form>
        </div>


        <div className="panel-illustration">
          <h2>Nouveau ici ?</h2>
          <p>
            Créez un compte pour rejoindre notre communauté et profiter de tous nos services.
          </p>
          <Link to="/signup" className="btn btn-outline">
            S'inscrire
          </Link>
          <img src={loginIllustration} alt="Illustration de connexion" className="illustration" />
        </div>
      </div>
    </div>
  );
};

export default Login;