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

  const updateFilters = (patch, resetPage = false) => {
    const next = {
      ...filters,
      ...patch,
      page: resetPage ? 1 : filters.page,
    };
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
          <h1 className="text-3xl font-black text-white">Games</h1>
          <p className="text-sm text-gray-400 mt-1">
            {meta.total} games found
          </p>
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
