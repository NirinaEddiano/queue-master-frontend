import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './styles.css';

const FeedbackForm = ({ sessionId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Veuillez sélectionner une note entre 1 et 5');
      toast.error('Note invalide');
      return;
    }
    try {
      const token = localStorage.getItem('token'); // Assuming JWT token is stored
      await axios.post(
        'http://localhost:8000/api/feedback/',
        {
          session: sessionId,
          rating,
          comment,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess('Feedback soumis avec succès !');
      toast.success('Feedback envoyé');
      setRating(0);
      setComment('');
    } catch (err) {
      console.log('Error response:', err.response?.data);
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.rating?.[0] ||
        err.response?.data?.session?.[0] ||
        'Erreur lors de la soumission du feedback'
      );
      toast.error('Échec de la soumission');
    }
  };

  return (
    <div className="card gold-border w-full max-w-md animate-slide-in p-6">
      <h2 className="text-2xl font-bold text-primary-blue mb-4 text-center">
        <i className="fas fa-star mr-2 text-accent-gold animate-pulse"></i> Donner votre avis
      </h2>
      {error && (
        <p className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-green-500 mb-4 p-3 bg-green-50 rounded-lg">{success}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-primary-blue mb-2 font-medium">Note (1 à 5)</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-primary-blue mb-2 font-medium">Commentaire</label>
          <textarea
            placeholder="Votre commentaire (facultatif)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-turquoise"
            rows="4"
          />
        </div>
        <button type="submit" className="cta-button w-full">
          Soumettre
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;