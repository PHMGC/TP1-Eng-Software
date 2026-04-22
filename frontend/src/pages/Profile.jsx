import { Link } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';

export default function Profile() {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 text-2xl font-bold text-white mb-6">
        <User className="text-primary" size={28} />
        Meu Perfil
      </div>

      <div className="bg-surface border border-gray-800 rounded-3xl p-8">
        <div className="mb-6 text-gray-300">
          <p className="text-lg font-semibold text-white">Bem-vindo à sua conta</p>
          <p className="text-sm text-gray-400">
            Ainda não há informações de usuário, pois o sistema de autenticação não foi implementado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-background/70 border border-gray-800 rounded-3xl p-6">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Nome</p>
            <p className="text-white font-semibold">Convidado</p>
          </div>
          <div className="bg-background/70 border border-gray-800 rounded-3xl p-6">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Status</p>
            <p className="text-white font-semibold">Não autenticado</p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-black font-semibold rounded-full hover:bg-primaryHover transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
