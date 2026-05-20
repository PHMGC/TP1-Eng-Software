import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/register', { username, email, password });
      const loginResponse = await api.post('/auth/login', { username, password });
      auth.login(loginResponse.data.user, loginResponse.data.token);
      navigate('/profile', { replace: true });
    } catch (err) {
      const message = err.response?.data?.error || 'Não foi possível criar a conta.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in duration-500 py-16">
      <div className="bg-surface border border-gray-800 rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-3">Cadastrar</h1>
        <p className="text-gray-400 mb-6">Crie sua conta para usar wishlist, avaliações e perfil.</p>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-700 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Nome de usuário
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-background/70 px-4 py-3 text-white focus:border-primary focus:outline-none"
              placeholder="Seu usuário"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-background/70 px-4 py-3 text-white focus:border-primary focus:outline-none"
              placeholder="seu@email.com"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-300">
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-background/70 px-4 py-3 text-white focus:border-primary focus:outline-none"
              placeholder="Senha segura"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-4 py-3 text-black font-semibold transition hover:bg-primaryHover disabled:opacity-60"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary hover:text-primaryHover">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
