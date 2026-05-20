import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import GameCard from '../components/GameCard';
import { Search, Filter, Loader2 } from 'lucide-react';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const LIMIT = 24;

  useEffect(() => {
    // Reset when search/genre changes
    setGames([]);
    setPage(1);
    setHasMore(true);
    fetchResults(1, true);
  }, [query, genre]);

  async function fetchResults(pageToFetch, isNewSearch = false) {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Always use /games endpoint as it's the most complete
      const params = {
        search: query,
        genre: genre,
        page: pageToFetch,
        limit: LIMIT,
        sort: 'wasted_score'
      };

      const response = await api.get('/games', { params });
      const newGames = response.data.data || [];
      
      if (isNewSearch) {
        setGames(newGames);
      } else {
        setGames(prev => [...prev, ...newGames]);
      }

      setTotal(response.data.total || 0);
      setHasMore(newGames.length === LIMIT);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(nextPage);
  };

  const getTitle = () => {
    if (query && genre) {
      return `Search Results for "${query}" in ${genre}`;
    } else if (query) {
      return `Search Results for "${query}"`;
    } else if (genre) {
      return `${genre} Games`;
    }
    return 'Search Results';
  };

  const getIcon = () => {
    return genre ? <Filter className="text-primary" size={28} /> : <Search className="text-primary" size={28} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4 mb-8">
        <div className="flex items-center gap-3 text-2xl font-bold text-white">
          {getIcon()}
          {getTitle()}
        </div>
        <div className="text-sm text-gray-400">
          {total} {total === 1 ? 'game' : 'games'} found
        </div>
      </div>

      {loading && games.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface aspect-[4/3] rounded-xl border border-gray-800" />
          ))}
        </div>
      ) : games.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-surface border border-gray-800 hover:border-primary/50 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none shadow-xl"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Games'
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 glass rounded-2xl border border-gray-800">
          <p className="text-xl text-gray-400">
            {query || genre ? `No ${genre ? genre.toLowerCase() : ''} games found${query ? ` for "${query}"` : ''}.` : 'No results found.'}
          </p>
        </div>
      )}
    </div>
  );
}
