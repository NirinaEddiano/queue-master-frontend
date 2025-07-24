import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const hideNavbar = ['/login', '/signup'].includes(location.pathname);

  if (hideNavbar) return null;

  return (
    <nav className="bg-blue-500 p-4">
      <ul className="flex space-x-4 text-white">
        <li>
          <Link to="/home" className="hover:underline">
            Accueil
          </Link>
        </li>
        <li>
          <Link to="/suivi-ticket" className="hover:underline">
            File d’attente
          </Link>
        </li>
        <li>
          <Link to="/notifications" className="hover:underline">
            Notifications
          </Link>
        </li>
        <li>
          <Link to="/rendez-vous" className="hover:underline">
            Rendez-vous
          </Link>
        </li>
        <li>
          <Link to="/profil" className="hover:underline">
            Profil
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
