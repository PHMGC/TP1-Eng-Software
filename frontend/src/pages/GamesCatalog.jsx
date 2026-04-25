import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GameCard from '../components/GameCard';
import api from '../lib/api';
import {
  buildSearchParamsFromFilters,
  parseFiltersFromSearchParams,
  SORT_OPTIONS,
} from '../lib/catalogFilters';

export default function GamesCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);

  const getPageInfo = () => {
    if (filters.maxPlaytime === '10' && (filters.sort === 'wasted_score' || filters.sort === 'playtime_asc')) {
      return {
        title: 'Quick Sessions',
        desc: 'Short experiences for when you have an hour or two. Fast-paced or bite-sized games that respect your time.'
      };
    }
    if (filters.minPlaytime === '40' && filters.sort === 'playtime_desc') {
      return {
        title: 'Long Playtime',
        desc: 'Epic journeys that last for dozens of hours. Perfect for getting lost in another world.'
      };
    }
    if (filters.sort === 'trending') {
      return {
        title: 'Trending Games',
        desc: 'The most popular and discussed titles in the community right now.'
      };
    }
    if (filters.sort === 'rating_desc') {
      return {
        title: 'Top Rated',
        desc: 'The highest quality titles as judged by players across the globe.'
      };
    }
    if (filters.sort === 'name_asc') {
      return {
        title: 'A to Z Catalog',
        desc: 'Browse our entire library in alphabetical order.'
      };
    }
    return {
      title: 'Games Catalog',
      desc: 'Explore our complete library of games and find your next favorite adventure.'
    };
  };

  const pageInfo = getPageInfo();

  const updateFilters = (patch, resetPage = false) => {
    const next = {
      ...filters,
      ...patch,
    };
    if (resetPage) {
      next.page = 1;
    }
    setSearchParams(buildSearchParamsFromFilters(next));
  };

  useEffect(() => {
    async function fetchGenres() {
      try {
        const response = await api.get('/genres');
        setGenres(response.data || []);
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    }
    fetchGenres();
  }, []);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/games', { params: filters });
        setGames(response.data.data || []);
        setMeta({
          total: response.data.total || 0,
          pages: response.data.pages || 1,
        });
      } catch (err) {
        console.error('Error loading catalog:', err);
        setError(err?.response?.data?.error || 'Could not load catalog games.');
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [filters]);

  useEffect(() => {
    if (!loading && meta.pages > 0 && filters.page > meta.pages) {
      updateFilters({ page: meta.pages });
    }
  }, [loading, meta.pages, filters.page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">{pageInfo.title}</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            {pageInfo.desc}
          </p>
        </div>
        <div className="text-sm font-medium bg-surface/50 border border-gray-800 px-3 py-1 rounded-full text-gray-400">
          {meta.total} games
        </div>
      </div>

      <section className="glass rounded-2xl border border-gray-800 p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-gray-400">Search</span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value }, true)}
              placeholder="Game name..."
              className="w-full bg-surface/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-gray-400">Genre</span>
            <select
              value={filters.genre}
              onChange={(e) => updateFilters({ genre: e.target.value }, true)}
              className="w-full bg-surface/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.slug || genre.name}>
                  {genre.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-gray-400">Sort</span>
            <select
              value={filters.sort}
              onChange={(e) => updateFilters({ sort: e.target.value }, true)}
              className="w-full bg-surface/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

        </div>
      </section>

      {error && (
        <div className="border border-red-900/50 bg-red-950/40 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="animate-pulse bg-surface aspect-[4/3] rounded-xl border border-gray-800" />
          ))}
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl border border-gray-800 p-10 text-center text-gray-400">
          Nenhum jogo encontrado com os filtros atuais.
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
          disabled={filters.page <= 1}
          className="px-4 py-2 rounded-lg border border-gray-700 bg-surface/60 text-sm text-white disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-gray-400">
          Page {filters.page} of {Math.max(1, meta.pages)}
        </span>
        <button
          type="button"
          onClick={() => updateFilters({ page: Math.min(meta.pages, filters.page + 1) })}
          disabled={filters.page >= meta.pages}
          className="px-4 py-2 rounded-lg border border-gray-700 bg-surface/60 text-sm text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
