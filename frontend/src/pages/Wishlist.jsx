import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';

export default function Wishlist() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 text-2xl font-bold text-white mb-6">
        <Heart className="text-primary" size={28} />
        Minhas Listas de Desejos
      </div>

      <div className="bg-surface border border-gray-800 rounded-3xl p-8 text-center">
        <p className="text-gray-400 mb-4">Sua lista de desejos está vazia por enquanto.</p>
        <p className="text-sm text-gray-500">
          Adicione jogos à sua lista para acompanhar títulos futuros que você quer jogar.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-black font-semibold rounded-full hover:bg-primaryHover transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
