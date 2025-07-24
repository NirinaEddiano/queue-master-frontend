import React from 'react';

const Accueil = () => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Bienvenue dans le système de gestion de file d'attente</h1>
      <p>Choisissez votre rôle :</p>
      <div className="mt-4">
        <button className="bg-blue-500 text-white p-2 mr-2">Client</button>
        <button className="bg-green-500 text-white p-2 mr-2">Guichetier</button>
        <button className="bg-red-500 text-white p-2">Admin</button>
      </div>
    </div>
  );
};

export default Accueil;