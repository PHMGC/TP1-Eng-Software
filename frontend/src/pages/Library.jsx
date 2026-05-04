import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import GameCard from '../components/GameCard';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { BookOpen, ArrowLeft, Loader2 } from 'lucide-react';

export default function Library() {
  const auth = useAuth();
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      return;
    }

    async function fetchLibrary() {
      setLoading(true);
      try {
        const response = await api.get('/library');
        setLibraryItems(response.data);
      } catch (err) {
        console.error('Error fetching library:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
        setError(`Could not load library: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchLibrary();
  }, [auth.isAuthenticated]);

  const handleRemoveFromLibrary = async (gameId) => {
    try {
      await api.delete(`/library/${gameId}`);
      setLibraryItems(prev => prev.filter(item => item.game_id !== gameId));
    } catch (err) {
      console.error('Error removing from library:', err);
      setError('Could not remove game from library.');
    }
  };

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 text-2xl font-bold text-white mb-6">
        <BookOpen className="text-primary" size={28} />
        Minha Biblioteca
        {libraryItems.length > 0 && (
          <span className="text-sm font-normal text-gray-400 bg-surface/50 px-2 py-1 rounded-full">
            {libraryItems.length} {libraryItems.length === 1 ? 'jogo' : 'jogos'}
          </span>
        )}
      </div>

      {libraryItems.length === 0 ? (
        <div className="bg-surface border border-gray-800 rounded-3xl p-8 text-center">
          <BookOpen className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 mb-4">Sua biblioteca está vazia por enquanto.</p>
          <p className="text-sm text-gray-500 mb-6">
            Adicione jogos à sua biblioteca para acompanhar o que você já possui ou já jogou.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-semibold rounded-full hover:bg-primaryHover transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar ao catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {libraryItems.map(item => (
            <div key={item.id} className="relative">
              <GameCard game={item.game} />
              <button
                onClick={() => handleRemoveFromLibrary(item.game_id)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover da biblioteca"
              >
                <BookOpen size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-600 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={30} />
        </div>
      )}
    </div>
  );
}
