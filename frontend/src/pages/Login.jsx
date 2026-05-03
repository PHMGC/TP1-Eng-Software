import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: identifier,
        email: identifier,
        password,
      });
      auth.login(response.data.user, response.data.token);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.error || 'Não foi possível fazer login. Verifique suas credenciais.';
      console.error('Login error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in duration-500 py-16">
      <div className="bg-surface border border-gray-800 rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-3">Entrar</h1>
        <p className="text-gray-400 mb-6">Acesse sua conta para gerenciar wishlist, avaliações e perfil.</p>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-700 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Nome de usuário ou email
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-background/70 px-4 py-3 text-white focus:border-primary focus:outline-none"
              placeholder="username ou email"
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
              placeholder="Senha"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-4 py-3 text-black font-semibold transition hover:bg-primaryHover disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Não tem conta?{' '}
          <Link to="/register" className="text-primary hover:text-primaryHover">
            Cadastre-se aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
