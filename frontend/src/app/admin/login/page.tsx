'use client';

import React, { useState } from 'react';
import { api, API_BASE_URL } from '@/services/api';
import '../admin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      // We need a specific call for OAuth2 form data
      const response = await fetch(`${API_BASE_URL}/auth/login/access-token`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'E-mail ou senha incorretos');
      }

      const data = await response.json();
      if (data.access_token && typeof window !== 'undefined') {
        localStorage.setItem('admin_token', data.access_token);
      }

      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#111'
    }}>
      <div className="login-card" style={{ 
        background: '#fff', 
        padding: '48px', 
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>SFIZIO</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem' }}>Acesso Administrativo</p>
        
        {error && <div style={{ color: 'red', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 600 }}>E-MAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 600 }}>SENHA</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#000', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
