import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PrendreTicket = () => {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [ticket, setTicket] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
            return;
        }

        axios.get('http://192.168.0.105:8000/api/services/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setServices(response.data);
            setSelectedService(response.data[0]?.id || '');
        })
        .catch(err => {
            setError('Erreur lors du chargement des services.');
        });
    }, [navigate]);

    const handleCreateTicket = () => {
        const token = localStorage.getItem('access_token');
        axios.post('http://192.168.0.105:8000/api/tickets/', 
            { service_id: selectedService },
            { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(response => {
            setTicket(response.data);
            setError('');
            navigate('/suivi-ticket');
        })
        .catch(err => {
            setError('Erreur lors de la création du ticket.');
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Prendre un ticket</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Choisir un service</label>
                    <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Sélectionnez un service</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleCreateTicket}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                    Obtenir un ticket
                </button>
                {ticket && (
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold">Votre ticket</h2>
                        <p>Numéro: {ticket.numero}</p>
                        <p>Service: {ticket.service.name}</p>
                        <p>Statut: {ticket.statut}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrendreTicket;