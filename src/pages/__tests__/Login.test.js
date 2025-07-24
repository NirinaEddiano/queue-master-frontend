
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Login from '../Login';

jest.mock('axios');

describe('Login Component', () => {
  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText('Nom d’utilisateur')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
  });

  test('submits login form successfully', async () => {
    axios.post.mockResolvedValue({
      data: { access: 'fake-token', refresh: 'fake-refresh' }
    });
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Nom d’utilisateur'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByText('Se connecter'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/token/',
        { username: 'testuser', password: 'testpass' }
      );
    });
  });

  test('displays error on failed login', async () => {
    axios.post.mockRejectedValue({
      response: { data: { detail: 'Identifiants incorrects' } }
    });
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Nom d’utilisateur'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('Se connecter'));
    await waitFor(() => {
      expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument();
    });
  });
});
