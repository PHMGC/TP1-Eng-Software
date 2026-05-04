import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Hourglass, User, Heart, BookOpen, Star, Menu, LogOut, LogIn } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Navbar({ onOpenSidebar }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const searchRef = useRef(null);

  // Fecha o dropdown ao mudar de rota
  useEffect(() => {
    setShowSuggestions(false);
    setQuery('');
  }, [location.pathname]);

  // Handle clique fora do dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce API call
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.get(`/games?search=${encodeURIComponent(query)}&limit=5`);
        setSuggestions(res.data.data);
      } catch (err) {
        console.error(err);
      }
    }, 400); // 400 ms delay base
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  };
  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex items-center justify-center rounded-lg border border-gray-800 bg-surface/30 p-2 text-gray-300 hover:text-white hover:bg-surface transition-colors cursor-pointer"
            aria-label="Open catalog menu"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primaryHover transition-colors">
            <Hourglass size={28} className="text-primary" />
            <span className="text-xl font-bold tracking-tight text-white">WastedHours</span>
          </Link>
        </div>
        
        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative" ref={searchRef}>
          <form onSubmit={handleSearch} className="w-full relative z-20">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Pesquisar jogos..." 
              className="w-full bg-surface/80 border border-gray-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:bg-surface transition-all text-white placeholder:text-gray-500 shadow-inner"
            />
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && query.trim() && (
            <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
              {suggestions.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">Nenhum resultado encontrado para "{query}"</div>
              ) : (
                <>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {suggestions.map(g => (
                      <Link 
                        key={g.id} 
                        to={`/game/${g.id}`} 
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 p-3 hover:bg-surfaceHover transition-colors border-b border-gray-800/50 last:border-0"
                      >
                        <img 
                          src={g.background_image || 'https://via.placeholder.com/40'} 
                          alt={g.name} 
                          className="w-10 h-10 object-cover rounded-md bg-gray-900 shrink-0" 
                        />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-white text-sm font-semibold truncate leading-tight mb-0.5">{g.name}</span>
                          <span className="text-xs text-gray-400 truncate">
                            {g.genres ? g.genres.map(gn => gn.name).join(', ') : 'Desconhecido'}
                          </span>
                        </div>
                        <div className="ml-auto flex items-center justify-center gap-1 text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-md shrink-0">
                          {g.rating ? g.rating.toFixed(1) : 'N/A'} <Star size={10} fill="currentColor" className="mt-[1px]" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  <button 
                    onClick={handleSearch}
                    className="p-3 w-full text-center text-sm font-bold text-primary hover:bg-primary/10 transition-colors bg-surfaceHover/50 border-t border-gray-800"
                  >
                    Ver todos os resultados
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <Link to="/wishlist" className="text-gray-400 hover:text-white transition-colors" title="Lista de Desejos">
            <Heart size={20} />
          </Link>
          <Link to="/library" className="text-gray-400 hover:text-white transition-colors" title="Minha Biblioteca">
            <BookOpen size={20} />
          </Link>
          {auth.isAuthenticated ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors border border-gray-800 rounded-full px-3 py-1.5 bg-surface/30 hover:bg-surface">
                <User size={18} />
                <span className="text-sm font-medium hidden sm:inline">Perfil</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  auth.logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors border border-gray-800 rounded-full px-3 py-1.5 bg-surface/30 hover:bg-surface"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors border border-gray-800 rounded-full px-3 py-1.5 bg-surface/30 hover:bg-surface">
              <LogIn size={18} />
              <span className="text-sm font-medium hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
