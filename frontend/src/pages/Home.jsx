import { useEffect, useState, useRef, useCallback } from 'react';
import GameCard from '../components/GameCard';
import api from '../lib/api';
import { Trophy, Flame, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// A formula única do WastedHours fora do componente para uso em arrays locais
const calculateScore = (game) => {
  if (!game) return 0;
  const base = (game.rating || 0) * 1.5;
  const playtimeBonus = Math.min(2.5, (game.playtime || 0) / 20);
  return parseFloat((base + playtimeBonus).toFixed(1));
};

export default function Home() {
  const [featuredGame, setFeaturedGame] = useState(null);
  const [trendingGames, setTrendingGames] = useState([]);
  const [catalogGames, setCatalogGames] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTrendingSlide, setActiveTrendingSlide] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);



  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) setItemsPerPage(10); // xl (5 cols * 2)
      else if (window.innerWidth >= 1024) setItemsPerPage(8); // lg (4 cols * 2)
      else if (window.innerWidth >= 640) setItemsPerPage(4); // sm (2 cols * 2)
      else setItemsPerPage(2); // base (1 col * 2)
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      try {
        if (!featuredGame) {
          const topResponse = await api.get(`/games?page=1&limit=30&sort=trending`);
          const topData = topResponse.data.data;
          // Ordena tudo do trending pela nossa métrica customizada primeiro
          const sortedTrending = topData.sort((a, b) => parseFloat(calculateScore(b)) - parseFloat(calculateScore(a)));
          if (sortedTrending.length > 0) setFeaturedGame(sortedTrending[0]);
          setTrendingGames(sortedTrending.slice(1));
        }

        const response = await api.get(`/games?page=1&limit=50`);
        const catSorted = response.data.data.sort((a, b) => parseFloat(calculateScore(b)) - parseFloat(calculateScore(a)));
        setCatalogGames(catSorted.slice(0, 50));
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('Could not load games. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, [featuredGame]);

  // Cálculos flutuantes de paginação
  const slidesCount = Math.ceil(catalogGames.length / itemsPerPage);

  const trendingItemsPerPage = Math.max(1, itemsPerPage / 2);
  const trendingSlidesCount = 3;
  const perfectTrendingGames = trendingGames.slice(0, trendingItemsPerPage * trendingSlidesCount);

  const featuredScore = calculateScore(featuredGame);

  // Helper para o badge do Featured Game (mesma lógica dos cards)
  const getBadgeIcon = (score) => {
    if (score >= 8.5) return "🤩";
    if (score >= 6.0) return "👍";
    return "🛌";
  };

  const featuredBadge = featuredGame ? getBadgeIcon(parseFloat(featuredScore)) : "👍";

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-16">
      
      {error && (
        <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-4 text-red-200 text-center">
          {error}
        </div>
      )}

      {/* Hero Section (Steam-like Featured Game) */}
      {featuredGame && (
        <section className="relative rounded-2xl overflow-hidden glass border-gray-800 shadow-2xl group cursor-pointer" onClick={() => window.location.href = `/game/${featuredGame.id}`}>
          <div className="absolute inset-0">
            <img 
              src={featuredGame.background_image} 
              alt={featuredGame.name} 
              className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
          </div>
          
          <div className="relative z-10 p-8 md:p-12 max-w-2xl">
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-bold uppercase tracking-wider backdrop-blur-md">
              Featured Game
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg leading-tight">
              {featuredGame.name}
            </h1>
            <div className="text-gray-300 text-lg mb-8 line-clamp-3 prose prose-invert">
              {featuredGame.description ? <div dangerouslySetInnerHTML={{ __html: featuredGame.description }} /> : 'An interactive masterpiece that defined a generation.'}
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <button className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                View Details
              </button>
              <div className="flex items-center gap-2 px-4 py-3 glass rounded-lg text-white font-semibold" title={`Playtime: ${featuredGame?.playtime || 0}h`}>
                <span className="text-2xl leading-none">{featuredBadge}</span>
                Score {featuredScore}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Now */}
      {trendingGames.length > 0 && (
        <section className="group/section mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="text-primary" size={24} />
              Trending Now
            </h2>
          </div>
          
          <div className="relative mx-3 sm:mx-14 md:mx-16">
            <div className="overflow-hidden relative w-full pt-1">
              <div 
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ transform: `translateX(-${activeTrendingSlide * 100}%)` }}
              >
                {Array.from({ length: trendingSlidesCount }).map((_, slideIdx) => {
                  const pageGames = perfectTrendingGames.slice(slideIdx * trendingItemsPerPage, (slideIdx + 1) * trendingItemsPerPage);
                  return (
                    <div key={slideIdx} className="w-full shrink-0 flex-none px-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {pageGames.map(game => (
                          <GameCard key={game.id} game={game} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trending Arrows */}
            {trendingSlidesCount > 1 && (
              <>
                <button 
                  onClick={() => setActiveTrendingSlide(s => Math.max(0, s - 1))}
                  disabled={activeTrendingSlide === 0}
                  className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-12 z-10 p-2 bg-surface hover:bg-primary text-white border border-gray-700 rounded-full transition-all shadow-xl shadow-black/80 opacity-0 group-hover/section:opacity-100 disabled:!opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setActiveTrendingSlide(s => Math.min(trendingSlidesCount - 1, s + 1))}
                  disabled={activeTrendingSlide === trendingSlidesCount - 1}
                  className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-12 z-10 p-2 bg-surface hover:bg-primary text-white border border-gray-700 rounded-full transition-all shadow-xl shadow-black/80 opacity-0 group-hover/section:opacity-100 disabled:!opacity-0 disabled:pointer-events-none"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Bolinhas Trending */}
          {trendingSlidesCount > 1 && (
            <div className="flex justify-center items-center gap-2.5 mt-8 mb-2">
              {Array.from({ length: trendingSlidesCount }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveTrendingSlide(i)}
                  className={`transition-all duration-300 rounded-full focus:outline-none ${
                    activeTrendingSlide === i 
                    ? 'w-8 h-2.5 bg-primary shadow-[0_0_12px_rgba(255,107,107,0.6)]' 
                    : 'w-2.5 h-2.5 bg-gray-700 hover:bg-gray-500 hover:scale-125'
                  }`}
                  aria-label={`Ir para a página ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* All Catalog */}
      <section className="group/section">
        <h2 className="text-xl font-bold text-gray-400 mb-6 uppercase tracking-wider border-b border-gray-800 pb-2">
          Top Rated Classics
        </h2>
        {loading && catalogGames.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse bg-surface aspect-[4/3] rounded-xl border border-gray-800" />
            ))}
          </div>
        ) : (
          <div className="relative mx-3 sm:mx-14 md:mx-16">
            <div className="overflow-hidden relative w-full pt-1">
              <div 
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {Array.from({ length: slidesCount }).map((_, slideIdx) => {
                  const isVisible = Math.abs(slideIdx - activeSlide) <= 2; // Windowing render
                  const pageGames = catalogGames.slice(slideIdx * itemsPerPage, (slideIdx + 1) * itemsPerPage);
                  return (
                    <div key={slideIdx} className="w-full shrink-0 flex-none px-1 h-full min-h-[300px]">
                      {isVisible ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                          {pageGames.map(game => (
                            <GameCard key={game.id} game={game} />
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-transparent" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Catalog Arrows */}
            {slidesCount > 1 && (
              <>
                <button 
                  onClick={() => setActiveSlide(s => Math.max(0, s - 1))}
                  disabled={activeSlide === 0}
                  className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-12 z-10 p-2 bg-surface hover:bg-primary text-white border border-gray-700 rounded-full transition-all shadow-xl shadow-black/80 opacity-0 group-hover/section:opacity-100 disabled:!opacity-0 disabled:pointer-events-none hover:scale-110"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setActiveSlide(s => Math.min(slidesCount - 1, s + 1))}
                  disabled={activeSlide === slidesCount - 1}
                  className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-12 z-10 p-2 bg-surface hover:bg-primary text-white border border-gray-700 rounded-full transition-all shadow-xl shadow-black/80 opacity-0 group-hover/section:opacity-100 disabled:!opacity-0 disabled:pointer-events-none hover:scale-110"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Bolinhas estilo Instagram (Dynamic Rendering Array) */}
        {!loading && slidesCount > 1 && (
          <div className="flex justify-center items-center mt-10 mb-2 h-6 w-full gap-3">
            {Array.from({ length: slidesCount }).map((_, i) => {
              const diff = Math.abs(i - activeSlide);
              if (diff > 3) return null; // Remove as muito distantes
              
              let extraClasses = 'w-2.5 h-2.5 bg-gray-700 hover:bg-gray-500 cursor-pointer';
              if (diff === 0) extraClasses = 'w-8 h-2.5 bg-primary shadow-[0_0_12px_rgba(255,107,107,0.6)]';
              else if (diff === 1) extraClasses = 'w-2.5 h-2.5 bg-gray-500 hover:bg-gray-400 cursor-pointer';
              else if (diff === 2) extraClasses = 'w-1.5 h-1.5 bg-gray-600 cursor-pointer';
              else extraClasses = 'w-1 h-1 bg-gray-800 opacity-50 pointer-events-none';

              return (
                <button 
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`transition-all duration-300 rounded-full focus:outline-none shrink-0 ${extraClasses}`}
                  aria-label={`Página ${i + 1}`}
                />
              );
            })}
          </div>
        )}
      </section>

      {!loading && !error && catalogGames.length === 0 && !featuredGame && (
        <div className="text-center text-gray-500 py-20 glass rounded-2xl">
          No games found in the database. Please populate the catalog.
        </div>
      )}
    </div>
  );
}
