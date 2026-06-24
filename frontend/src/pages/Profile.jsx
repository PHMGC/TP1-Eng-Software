import { Link, Navigate, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Trash2, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import api from '../lib/api';

export default function Profile() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: auth.user?.bio || '',
    avatar_url: auth.user?.avatar_url || ''
  });

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

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await api.put('/auth/me', editForm);
      auth.updateUser(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Falha ao salvar perfil. Tente novamente.');
    } finally {
      setSaveLoading(false);
    }
  };
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-3 text-2xl font-bold text-white mb-6">
        <User className="text-primary" size={28} />
        Meu Perfil
      </div>

      <div className="bg-surface border border-gray-800 rounded-3xl p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {auth.user?.avatar_url ? (
              <img src={auth.user.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700">
                <User size={32} className="text-gray-400" />
              </div>
            )}
            <div>
              <p className="text-xl font-semibold text-white">Bem-vindo, {auth.user?.username || 'Usuário'}!</p>
              <p className="text-sm text-gray-400">
                Gerencie sua conta e informações por aqui.
              </p>
            </div>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-primary hover:text-primaryHover transition-colors">
              <Edit2 size={18} />
              <span className="text-sm font-semibold">Editar</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="bg-background/70 border border-gray-800 rounded-2xl p-6 mb-8 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">URL do Avatar</label>
              <input 
                type="text" 
                value={editForm.avatar_url} 
                onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                placeholder="https://..."
                className="w-full bg-surface border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Biografia</label>
              <textarea 
                value={editForm.bio} 
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                placeholder="Fale um pouco sobre você..."
                rows={3}
                className="w-full bg-surface border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setIsEditing(false)} disabled={saveLoading} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveProfile} disabled={saveLoading} className="px-6 py-2 bg-primary hover:bg-primaryHover text-black font-semibold rounded-lg flex items-center gap-2 transition-colors">
                {saveLoading ? <span className="animate-pulse">Salvando...</span> : <><Save size={18} /> Salvar</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <div className="bg-background/70 border border-gray-800 rounded-3xl p-6">
              <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Biografia</p>
              <p className="text-white text-sm whitespace-pre-wrap">{auth.user?.bio || <span className="text-gray-600 italic">Nenhuma biografia definida.</span>}</p>
            </div>
            <div className="bg-background/70 border border-gray-800 rounded-3xl p-6">
              <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Email</p>
              <p className="text-white font-semibold">{auth.user?.email || 'N/A'}</p>
            </div>
          </div>
        )}

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-gray-700 hover:border-gray-500 text-white font-semibold rounded-full transition-colors"
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
