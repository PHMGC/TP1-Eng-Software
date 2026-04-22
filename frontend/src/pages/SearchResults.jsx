import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import GameCard from '../components/GameCard';
import { Search, Filter } from 'lucide-react';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        let endpoint = '/games';
        let params = [];
        
        if (query) {
          params.push(`search=${encodeURIComponent(query)}`);
        }
        
        if (genre) {
          endpoint = '/games/filter';
          params.push(`genre=${encodeURIComponent(genre)}`);
        }
        
        const url = `${endpoint}?${params.join('&')}`;
        const response = await api.get(url);
        setGames(response.data.data);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (query || genre) {
      fetchResults();
    } else {
      setGames([]);
      setLoading(false);
    }
  }, [query, genre]);

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 text-2xl font-bold text-white mb-8 border-b border-gray-800 pb-4">
        {getIcon()}
        {getTitle()}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-surface aspect-[4/3] rounded-xl border border-gray-800" />
          ))}
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-gray-400">
            {query || genre ? `No ${genre ? genre.toLowerCase() : ''} games found${query ? ` for "${query}"` : ''}.` : 'No results found.'}
          </p>
        </div>
      )}
    </div>
  );
}
