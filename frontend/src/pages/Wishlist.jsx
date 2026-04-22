import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GameCard from '../components/GameCard';
import api from '../lib/api';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWishlist() {
      setLoading(true);
      try {
        const response = await api.get('/wishlist');
        setWishlistItems(response.data);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError('Could not load wishlist. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (gameId) => {
    try {
      await api.delete(`/wishlist/${gameId}`);
      setWishlistItems(prev => prev.filter(item => item.game_id !== gameId));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError('Could not remove game from wishlist.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in duration-500 space-y-6">
        <div className="flex items-center gap-3 text-2xl font-bold text-white mb-6">
          <Heart className="text-primary" size={28} />
          Minhas Listas de Desejos
        </div>
        <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-4 text-red-200 text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 text-2xl font-bold text-white mb-6">
        <Heart className="text-primary" size={28} />
        Minhas Listas de Desejos
        {wishlistItems.length > 0 && (
          <span className="text-sm font-normal text-gray-400 bg-surface/50 px-2 py-1 rounded-full">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'jogo' : 'jogos'}
          </span>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-surface border border-gray-800 rounded-3xl p-8 text-center">
          <Heart className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400 mb-4">Sua lista de desejos está vazia por enquanto.</p>
          <p className="text-sm text-gray-500 mb-6">
            Adicione jogos à sua lista para acompanhar títulos futuros que você quer jogar.
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
          {wishlistItems.map(item => (
            <div key={item.id} className="relative">
              <GameCard game={item.game} />
              <button
                onClick={() => handleRemoveFromWishlist(item.game_id)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover da lista de desejos"
              >
                <Heart size={16} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
