import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { getWastedTimeStatus, calculateScore } from '../lib/utils';


export default function GameCard({ game }) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Configurações e falbacks caso os dados não existam
  const rating = game.rating || 0;

  // Total de avaliações (somando as contagens de cada distribuição de notas, se houver)
  const reviewsCount = game.ratings_distribution ?
    game.ratings_distribution.reduce((acc, r) => acc + (r.count || 0), 0) : 100;

  const imageUrl = game.background_image || 'https://via.placeholder.com/400x225?text=Sem+Imagem';

  const finalScore = calculateScore(game);
  const status = getWastedTimeStatus(finalScore);

  function getBadgeIcon(score) {
    if (score >= 8.5) return "🤩";
    if (score >= 6.0) return "👍";
    return "🛌";
  }
  const badgeIcon = getBadgeIcon(parseFloat(finalScore));

  // Check if game is in wishlist on mount
  useEffect(() => {
    async function checkWishlistStatus() {
      try {
        const response = await api.get('/wishlist');
        const inWishlist = response.data.some(item => item.game_id === game.id);
        setIsInWishlist(inWishlist);
      } catch (err) {
        console.error('Error checking wishlist status:', err);
      }
    }
    checkWishlistStatus();
  }, [game.id]);

  const handleWishlistToggle = async (e) => {
    e.preventDefault(); // Prevent navigation to game details
    e.stopPropagation();

    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/${game.id}`);
        setIsInWishlist(false);
      } else {
        await api.post('/wishlist', { game_id: game.id });
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link to={`/game/${game.id}`} className="group relative rounded-xl overflow-hidden bg-surface hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border border-gray-800 hover:border-gray-700 flex flex-col h-full transform hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        <img
          src={imageUrl}
          alt={game.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-in-out"
          loading="lazy"
        />
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isInWishlist
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-black/50 hover:bg-black/70 text-gray-300 hover:text-white'
          } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isInWishlist ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isInWishlist ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className="transition-all"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 relative">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {game.name}
        </h3>

        {/* Info badges */}
      <div className={`flex items-center gap-2 justify-center px-2.5 py-1 rounded-md border ${status.bg} ${status.border}`} title={`Score: ${finalScore}`}>
        <img
          src={`/hourglass-${status.hourglassLevel}.svg`}
          alt={`Hourglass ${status.hourglassLevel}`}
          className="h-4 w-4"
          style={{ filter: status.filter }}
        />
        <span className={`text-sm font-bold ${status.color}`}>{finalScore}</span>
      </div>
      </div>
    </Link>
  );
}
