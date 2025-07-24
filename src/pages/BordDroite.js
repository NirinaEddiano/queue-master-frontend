import React, { useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './BordDroite.css';

const BordDroite = () => {
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [totalTickets, setTotalTickets] = useState(0);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchData = async () => {
        if (!isMounted.current) return;
      try {
        if (!username) {
            const userResponse = await axios.get('/api/users/user/');
            if (isMounted.current) {
              setUsername(userResponse.data.username);
              const imageUrl = userResponse.data.profile_image
                ? userResponse.data.profile_image.startsWith('http')
                  ? userResponse.data.profile_image
                  : `http://localhost:8000${userResponse.data.profile_image}`
                : 'https://via.placeholder.com/80';
              setProfileImage(imageUrl);
            }
        }
  
        const ticketsResponse = await axios.get('/api/tickets/list/?user_only=true');
        if (isMounted.current) {
            const userTickets = ticketsResponse.data || [];
            const active = userTickets.find(
              (ticket) => ticket.statut === 'attente' || ticket.statut === 'called'
            );
        setActiveTicket(active);
        if (active) {
          const queueResponse = await axios.get(`/api/tickets/queue/?bank_id=${active.bank.id}&service_id=${active.service.id}`);
          setTotalTickets(queueResponse.data.length);
        } else {
          setTotalTickets(0);
        }
    }
      } catch (err) {
        console.error('Erreur récupération données:', err);
        toast.error('Erreur lors du chargement des données');
      }
    };
  
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => {
        isMounted.current = false;
        clearInterval(intervalId);
    };
  }, [username]);

  const handleTakeTicket = () => {
    navigate('/home');
  };

  const handleTrackQueue = () => {
    navigate(`/suivi-ticket?bank_id=${activeTicket.bank.id}&service_id=${activeTicket.service.id}`);
  };

  return (
    <div className="bord-droite">
      <div className="profile-section">
        <img
          src={profileImage}
          alt="Profile"
          className="profile-image"
        />
        <h3 className="username">{username || 'Client'}</h3>
      </div>
      <div className="ticket-section">
        {activeTicket ? (
          <>
            <h4 className="ticket-title">Ticket Actif</h4>
            <div className="ticket-details">
              <p><strong>Banque :</strong> {activeTicket.bank.name}</p>
              <p><strong>Service :</strong> {activeTicket.service.name}</p>  
              <p><strong>Guichet :</strong> {activeTicket.guichet?.number || 'Non assigné'}</p>
              <p><strong>Numéro :</strong> {activeTicket.numero}</p>
              <p><strong>Position :</strong> {activeTicket.position}/{totalTickets}</p>
            </div>
            <button
              onClick={handleTrackQueue}
              className="track-button"
            >
              <i className="fas fa-list-ul mr-2"></i> Suivre la file
            </button>
          </>
        ) : (
          <>
            <h4 className="ticket-title">Pas de ticket actif</h4>
            <button
              onClick={handleTakeTicket}
              className="take-ticket-button"
            >
              <i className="fas fa-ticket-alt mr-2"></i> Prendre un ticket
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BordDroite;