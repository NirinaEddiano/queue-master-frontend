import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ClientNavbar from './ClientNavbar';
import BordDroite from './BordDroite';
import './styles.css';

const RendezVous = () => {
  const [banks, setBanks] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ bankId: '', serviceId: '', date: '', time: '' });
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('Veuillez vous connecter');
          navigate('/login');
          return;
        }
        const bankResponse = await axios.get('/api/banks/');
        setBanks(bankResponse.data);
        const appointmentResponse = await axios.get('/api/appointments/list/');
        setAppointments(appointmentResponse.data);
      } catch (err) {
        setError('Erreur lors du chargement des données.');
        toast.error('Erreur lors du chargement des données');
      }
    };
    fetchData();
  }, [navigate]);

  const handleBankChange = async (e) => {
    const bankId = e.target.value;
    setForm({ ...form, bankId, serviceId: '' });
    try {
      const serviceResponse = await axios.get(`/api/services/?bank_id=${bankId}`);
      setServices(serviceResponse.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des services');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const appointment = {
        bank_id: form.bankId,
        service_id: form.serviceId,
        date_time: `${form.date}T${form.time}:00Z`,
      };
      const response = await axios.post('/api/appointments/', appointment);
      setAppointments((prev) => [...prev, response.data]);
      toast.success('Rendez-vous pris avec succès');
      setForm({ bankId: '', serviceId: '', date: '', time: '' });
      setActiveTab('list');
    } catch (err) {
      toast.error('Erreur lors de la prise de rendez-vous');
    }
  };

  const handleCancel = async (id) => {
    try {
      const response = await axios.post(`/api/appointments/${id}/annuler/`);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success(response.data.message);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Rendez-vous non trouvé');
      } else {
        toast.error('Erreur lors de l’annulation');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <ClientNavbar />
      <main className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold text-primary-blue flex items-center">
            <i className="fas fa-calendar-alt mr-2 text-accent-gold animate-pulse"></i> Rendez-vous
          </h1>
          
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8 animate-slide-in">
            {error}
          </div>
        )}
        <div className="card gold-border animate-slide-in">
          <div className="flex border-b mb-4">
            <button
              className={`flex-1 py-3 text-center font-semibold ${
                activeTab === 'form' ? 'border-b-4 border-accent-gold text-primary-blue' : 'text-gray-600'
              } transition-colors`}
              onClick={() => setActiveTab('form')}
            >
              Prendre un rendez-vous
            </button>
            <button
              className={`flex-1 py-3 text-center font-semibold ${
                activeTab === 'list' ? 'border-b-4 border-accent-gold text-primary-blue' : 'text-gray-600'
              } transition-colors`}
              onClick={() => setActiveTab('list')}
            >
              Mes rendez-vous
            </button>
          </div>
          {activeTab === 'form' && (
            <div>
              <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center">
                <i className="fas fa-calendar-plus mr-2 text-accent-gold animate-pulse"></i> Prendre un rendez-vous
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-primary-blue mb-2 font-medium">Banque</label>
                  <select
                    value={form.bankId}
                    onChange={handleBankChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                    required
                  >
                    <option value="">Sélectionnez une banque</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-primary-blue mb-2 font-medium">Service</label>
                  <select
                    value={form.serviceId}
                    onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                    required
                  >
                    <option value="">Sélectionnez un service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-primary-blue mb-2 font-medium">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-primary-blue mb-2 font-medium">Heure</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="cta-button w-full"
                >
                  Prendre rendez-vous
                </button>
              </form>
            </div>
          )}
          {activeTab === 'list' && (
            <div>
              <h2 className="text-2xl font-semibold text-primary-blue mb-4 flex items-center">
                <i className="fas fa-list mr-2 text-accent-gold animate-pulse"></i> Mes rendez-vous
              </h2>
              {appointments.length === 0 ? (
                <p className="text-gray-600">Aucun rendez-vous pris.</p>
              ) : (
                <ul className="space-y-4">
                  {appointments.map((appointment) => (
                    <li
                      key={appointment.id}
                      className="flex justify-between items-center p-4 bg-bg-light rounded-lg shadow-sm animate-slide-in"
                    >
                      <div>
                        <p className="font-medium text-primary-blue">{appointment.service.name} - {appointment.bank.name}</p>
                        <p className="text-gray-600">
                          {new Date(appointment.date_time).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Annuler
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </main>
      <BordDroite />
    </div>
  );
};

export default RendezVous;