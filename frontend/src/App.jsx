import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GameDetails from './pages/GameDetails';
import SearchResults from './pages/SearchResults';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import GamesCatalog from './pages/GamesCatalog';
import Login from './pages/Login';
import Register from './pages/Register';
import { X } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';

const sidebarLinks = [
  { label: 'All Games', to: '/games' },
  { label: 'Trending', to: '/games?sort=trending' },
  { label: 'Top Rated', to: '/games?sort=rating_desc' },
  { label: 'Long Playtime', to: '/games?sort=playtime_desc&minPlaytime=40' },
  { label: 'Quick Sessions', to: '/games?sort=wasted_score&maxPlaytime=10' },
  { label: 'A to Z', to: '/games?sort=name_asc' },
];

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname, location.search]);


  return (
    <div className="min-h-screen bg-background text-gray-100 overflow-x-hidden">
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-surface border-r border-gray-800 shadow-2xl p-5 z-[70] transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-bold">Explore Games</h2>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-800 bg-surface/60 p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Close catalog menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-2">
          {sidebarLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block rounded-lg border border-gray-800 bg-surface/40 px-3 py-2.5 text-sm text-gray-200 hover:bg-primary/10 hover:border-primary/30 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div
        className={`min-h-screen flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-64' : 'translate-x-0'
        }`}
      >
        <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<GamesCatalog />} />
            <Route path="/game/:id" element={<GameDetails />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
