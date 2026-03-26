import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Star, Clock, Calendar, ArrowLeft, Heart, ShieldAlert, Users, MessageSquareQuote, CheckCircle2 } from 'lucide-react';

export default function GameDetails() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGame() {
      try {
        const response = await api.get(`/games/${id}`);
        setGame(response.data);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Could not load game information.');
      } finally {
        setLoading(false);
      }
    }
    fetchGame();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-pulse w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"/>
    </div>
  );

  if (error || !game) return (
    <div className="text-center py-20 text-red-400">
      <ShieldAlert size={48} className="mx-auto mb-4" />
      <h2 className="text-xl">{error}</h2>
      <Link to="/" className="text-primary mt-4 inline-block hover:underline">Return to Home</Link>
    </div>
  );

  const releaseDate = game.released ? new Date(game.released).toLocaleDateString() : 'Unknown';
  const reviewsCount = game.ratings_distribution ? 
    game.ratings_distribution.reduce((acc, r) => acc + (r.count || 0), 0) : 
    Math.floor(Math.random() * 50000 + 1000); // Simulando total de avaliações

  // Simulando se os reviews são "Muito Positivos" estilo Steam
  let reviewSentiment = "Mixed";
  let sentimentColor = "text-yellow-400";
  if (game.rating >= 4.5) { reviewSentiment = "Overwhelmingly Positive"; sentimentColor = "text-blue-400"; }
  else if (game.rating >= 4.0) { reviewSentiment = "Very Positive"; sentimentColor = "text-cyan-400"; }
  else if (game.rating >= 3.5) { reviewSentiment = "Mostly Positive"; sentimentColor = "text-green-400"; }

  const getCleanDescription = (desc) => {
    if (!desc) return null;
    const splitIndex = desc.search(/(<p>|<br\s*\/?>|\n)\s*(Español|Spanish|Deutsch|Français|Italiano|Русский|Português)\b/i);
    if (splitIndex !== -1) {
      return desc.substring(0, splitIndex).trim();
    }
    return desc;
  };

  const cleanDesc = getCleanDescription(game.description);
  
  function getBadge(r, reviews) {
    if (r >= 4.0 && reviews >= 500) return { icon: "🤩", text: "Masterpiece", desc: "Sleep is for the weak" };
    if (r < 3.5 || reviews < 50) return { icon: "🛌", text: "Sleep Fest", desc: "Certified snooze fest" };
    return { icon: "👍", text: "Solid Game", desc: "Worth your time" };
  }
  const statusBadge = getBadge(game.rating, reviewsCount);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 hover:-translate-x-1 transition-transform bg-surface/50 border border-gray-800 rounded-lg px-4 py-2">
        <ArrowLeft size={18} />
        All Games
      </Link>

      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl text-white font-black drop-shadow-lg mb-3">{game.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <span className="bg-primary/20 border border-primary/30 text-primary px-3 py-1.5 rounded-full flex items-center gap-2">
              <Clock size={16} />
              {game.playtime > 0 ? `${game.playtime} hours avg playtime` : 'Playtime unknown'}
            </span>
            <span className="bg-surface border border-gray-800 text-gray-300 px-3 py-1.5 rounded-full">
              {game.genres ? game.genres.map(g => g.name).join(', ') : 'Action, Adventure'}
            </span>
          </div>
        </div>
        
        {statusBadge && (
          <div className="glass px-6 py-4 rounded-2xl border-gray-700 flex flex-col items-center justify-center shrink-0">
            <span className="text-3xl mb-1">{statusBadge.icon}</span>
            <span className="font-black text-white text-lg">{statusBadge.text}</span>
            <span className="text-xs text-gray-400 max-w-[120px] text-center">{statusBadge.desc}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        
        {/* Coluna Principal */}
        <div className="space-y-8">
          {/* Main Visual */}
          <div className="rounded-2xl overflow-hidden aspect-video relative border border-gray-800 shadow-2xl bg-black">
            <img 
              src={game.background_image || 'https://via.placeholder.com/800x450'} 
              alt={game.name} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* About this game */}
          <section className="glass p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
              <MessageSquareQuote className="text-primary" />
              About This Game
            </h2>
            <div className="prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-primary max-w-none">
              {cleanDesc ? (
                <div dangerouslySetInnerHTML={{ __html: cleanDesc }} />
              ) : (
                <p>Not available.</p>
              )}
            </div>
          </section>

          {/* User Reviews Section */}
          <section className="glass p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
              <Users className="text-primary" />
              Community Reviews
            </h2>
            
            <div className="space-y-6">
              <div className="bg-surface/50 p-5 rounded-xl border border-gray-800 text-center">
                <p className="text-gray-400">Not available.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Coluna Sidebar Lateral (Estilo Steam) */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl sticky top-24">
            
            <div className="mb-6 space-y-4">
              {/* Avaliações Globais */}
              <div className="bg-surface/50 rounded-xl p-4 border border-gray-800">
                <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold block mb-1">Overall Reviews</span>
                <div className={`text-lg font-bold ${sentimentColor}`}>
                  {reviewSentiment}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ({reviewsCount.toLocaleString()} reviews)
                </div>
              </div>

              {/* Informações Steam-like */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Release Date:</span>
                  <span className="text-gray-300 font-medium">{releaseDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Developer:</span>
                  <span className="text-primary hover:underline cursor-pointer">
                    {game.developers && game.developers.length > 0 ? game.developers.join(', ') : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Publisher:</span>
                  <span className="text-primary hover:underline cursor-pointer">
                    {game.publishers && game.publishers.length > 0 ? game.publishers.join(', ') : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 border-t border-gray-800 pt-6">Manage on WastedHours</h3>
            <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 mb-3 hover:-translate-y-0.5">
              <Star size={20} />
              Rate Game
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-gray-800 border border-gray-700 text-white py-3.5 rounded-xl font-semibold transition-all hover:-translate-y-0.5">
              <Heart size={20} className="text-gray-400" />
              Add to Wishlist
            </button>

            {game.esrb_rating && (
              <div className="mt-8 pt-6 border-t border-gray-800 flex items-center gap-4">
                <div className="w-12 h-16 bg-gray-900 border border-gray-700 flex flex-col items-center justify-center rounded">
                  <span className="text-xs font-black text-white">{game.esrb_rating[0]}</span>
                </div>
                <div className="text-sm text-gray-400">ESRB Rating</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
