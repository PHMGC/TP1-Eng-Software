import { Link, Navigate, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

export default function Profile() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/auth/me');
      auth.logout();
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };
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
            <p className="text-white font-semibold">{auth.user?.username || 'Usuário'}</p>
          </div>
          <div className="bg-background/70 border border-gray-800 rounded-3xl p-6">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Status</p>
            <p className="text-white font-semibold">Autenticado</p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-black font-semibold rounded-full hover:bg-primaryHover transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao catálogo
        </Link>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <h3 className="text-lg font-bold text-red-400 mb-4">Zona de Perigo</h3>
          <p className="text-gray-400 text-sm mb-4">
            Esta ação não pode ser desfeita. Todos os seus dados, incluindo reviews e lista de desejos, serão permanentemente removidos.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-colors"
          >
            <Trash2 size={18} />
            Deletar Conta
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="text-red-400" size={24} />
                <h3 className="text-xl font-bold text-white">Deletar Conta</h3>
              </div>

              <p className="text-gray-300 mb-6">
                Tem certeza de que deseja deletar sua conta? Esta ação é <strong className="text-red-400">irreversível</strong> e removerá permanentemente:
              </p>

              <ul className="text-gray-400 text-sm space-y-2 mb-6">
                <li>• Seu perfil e informações pessoais</li>
                <li>• Todas as suas reviews e avaliações</li>
                <li>• Sua lista de desejos</li>
                <li>• Todo o histórico de atividades</li>
              </ul>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-surface border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                  disabled={deleteLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deletando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Deletar Conta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
