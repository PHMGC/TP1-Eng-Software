import { Link, useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Star, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    api.get(`/users/${id}`)
      .then((res) => { if (active) setProfile(res.data); })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-white mb-2">Usuário não encontrado</p>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const reviews = profile.reviews || [];

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="bg-surface border border-gray-800 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700">
              <User size={32} className="text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-xl font-semibold text-white">{profile.username}</p>
            {profile.created_at && (
              <p className="text-sm text-gray-400">
                Membro desde {new Date(profile.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="bg-background/70 border border-gray-800 rounded-3xl p-6">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Biografia</p>
          <p className="text-white text-sm whitespace-pre-wrap">
            {profile.bio || <span className="text-gray-600 italic">Nenhuma biografia definida.</span>}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-gray-800 rounded-3xl p-8">
        <h2 className="text-lg font-bold text-white mb-1">Reviews de {profile.username}</h2>
        <p className="text-gray-400 text-sm mb-6">{reviews.length} review(s)</p>

        {reviews.length === 0 ? (
          <p className="text-gray-600 italic">Este usuário ainda não escreveu reviews.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-surface/50 p-5 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor(review.rating / 2) ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                      />
                    ))}
                    <span className="text-sm text-gray-300 ml-1">{review.rating}/10</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                {review.review_text && (
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">{review.review_text}</p>
                )}
                <div className="flex items-center justify-between">
                  <Link to={`/game/${review.game_id}`} className="text-sm text-primary hover:text-primaryHover hover:underline">
                    Ver jogo
                  </Link>
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Heart size={14} className="text-red-400" />
                    {review.likes_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
