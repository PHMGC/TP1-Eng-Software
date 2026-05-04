import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { Star, Clock, Calendar, ArrowLeft, Heart, ShieldAlert, Users, MessageSquareQuote, CheckCircle2, Loader2, X, BookOpen } from 'lucide-react';
import { getWastedTimeStatus } from '../lib/utils';


export default function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    playtime_hours: '',
    review_text: ''
  });
  const [ratingLoading, setRatingLoading] = useState(false);
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    async function fetchGame() {
      try {
        const response = await api.get(`/games/${id}`);
        setGame(response.data);
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Could not load game information.');
      } finally {
        setLoading(false);
      }
    }
    fetchGame();
  }, [id]);

  // Check wishlist status when game loads
  useEffect(() => {
    if (game && auth.isAuthenticated) {
      async function checkWishlistStatus() {
        try {
          const response = await api.get('/wishlist');
          const inWishlist = response.data.some(item => item.game_id === game.id);
          setIsInWishlist(inWishlist);
        } catch (err) {
          console.error('Error checking wishlist status:', err);
        }
      }
      checkWishlistStatus();
    }
  }, [game, auth.isAuthenticated]);

  // Check library status when game loads
  useEffect(() => {
    if (game && auth.isAuthenticated) {
      async function checkLibraryStatus() {
        try {
          const response = await api.get('/library');
          const inLibrary = response.data.some(item => item.game_id === game.id);
          setIsInLibrary(inLibrary);
        } catch (err) {
          console.error('Error checking library status:', err);
        }
      }
      checkLibraryStatus();
    } else {
      setIsInLibrary(false);
    }
  }, [game, auth.isAuthenticated]);

  // Check user review when game loads
  useEffect(() => {
    if (game && auth.isAuthenticated) {
      async function fetchUserReview() {
        try {
          const response = await api.get(`/games/${game.id}/user-review`);
          setUserReview(response.data);
          setRatingForm({
            rating: response.data.rating,
            playtime_hours: response.data.playtime_hours || '',
            review_text: response.data.review_text || ''
          });
        } catch (err) {
          // No review found, that's okay
          setUserReview(null);
        }
      }
      fetchUserReview();
    }
  }, [game, auth.isAuthenticated]);

  // Fetch all reviews for the game
  useEffect(() => {
    if (game) {
      async function fetchAllReviews() {
        setReviewsLoading(true);
        try {
          const response = await api.get(`/reviews?game_id=${game.id}&limit=100`);
          setAllReviews(response.data || []);
        } catch (err) {
          console.error('Error fetching reviews:', err);
          setAllReviews([]);
        } finally {
          setReviewsLoading(false);
        }
      }
      fetchAllReviews();
    }
  }, [game]);

  const handleWishlistToggle = async () => {
    if (wishlistLoading || !game || !auth.isAuthenticated) return;

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/${game.id}`);
        setIsInWishlist(false);
      } else {
        await api.post('/wishlist', { game_id: game.id });
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleLibraryToggle = async () => {
    if (libraryLoading || !game || !auth.isAuthenticated) return;

    setLibraryLoading(true);
    try {
      if (isInLibrary) {
        await api.delete(`/library/${game.id}`);
        setIsInLibrary(false);
      } else {
        await api.post('/library', { game_id: game.id });
        setIsInLibrary(true);
      }
    } catch (err) {
      console.error('Error updating library:', err);
      alert('Failed to update library. Please try again.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (ratingLoading || !game || !auth.isAuthenticated) return;

    setRatingLoading(true);
    try {
      const reviewData = {
        game_id: game.id,
        rating: parseFloat(ratingForm.rating),
        playtime_hours: ratingForm.playtime_hours ? parseInt(ratingForm.playtime_hours) : null,
        review_text: ratingForm.review_text.trim() || null
      };

      const response = await api.post('/reviews', reviewData);
      setUserReview(response.data);
      setShowRatingModal(false);
    } catch (err) {
      console.error('Error submitting rating:', err);
      // Show error to user
      alert('Failed to submit review. Please try again.');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleRatingFormChange = (field, value) => {
    setRatingForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-pulse w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"/>
    </div>
  );

  if (error || !game) return (
    <div className="text-center py-20 text-red-400">
      <ShieldAlert size={48} className="mx-auto mb-4" />
      <h2 className="text-xl">{error}</h2>
      <Link to="/" className="text-primary mt-4 inline-block hover:underline">Return to Home</Link>
    </div>
  );

  const releaseDate = game.released ? new Date(game.released).toLocaleDateString() : 'Unknown';
  const reviewsCount = game.ratings_distribution ? 
    game.ratings_distribution.reduce((acc, r) => acc + (r.count || 0), 0) : 
    Math.floor(Math.random() * 50000 + 1000); // Simulando total de avaliações

  // Simulando se os reviews são "Muito Positivos" estilo Steam
  let reviewSentiment = "Mixed";
  let sentimentColor = "text-yellow-400";
  if (game.rating >= 4.5) { reviewSentiment = "Overwhelmingly Positive"; sentimentColor = "text-blue-400"; }
  else if (game.rating >= 4.0) { reviewSentiment = "Very Positive"; sentimentColor = "text-cyan-400"; }
  else if (game.rating >= 3.5) { reviewSentiment = "Mostly Positive"; sentimentColor = "text-green-400"; }

  const getCleanDescription = (desc) => {
    if (!desc) return null;
    const splitIndex = desc.search(/(<p>|<br\s*\/?>|\n)\s*(Español|Spanish|Deutsch|Français|Italiano|Русский|Português)\b/i);
    if (splitIndex !== -1) {
      return desc.substring(0, splitIndex).trim();
    }
    return desc;
  };

  const cleanDesc = getCleanDescription(game.description);
  
  const baseScore = (game.rating || 0) * 1.5;
  const playtimeBonus = Math.min(2.5, (game.playtime || 0) / 20);
  const finalScore = (baseScore + playtimeBonus).toFixed(1);
  const status = getWastedTimeStatus(finalScore);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 hover:-translate-x-1 transition-transform bg-surface/50 border border-gray-800 rounded-lg px-4 py-2 cursor-pointer"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl text-white font-black drop-shadow-lg mb-3">{game.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <span className="bg-primary/20 border border-primary/30 text-primary px-3 py-1.5 rounded-full flex items-center gap-2">
              <Clock size={16} />
              {game.playtime > 0 ? `${game.playtime} hours avg playtime` : 'Playtime unknown'}
            </span>
            <span className="bg-surface border border-gray-800 text-gray-300 px-3 py-1.5 rounded-full">
              {game.genres ? game.genres.map(g => g.name).join(', ') : 'Action, Adventure'}
            </span>
          </div>
        </div>
        
        {status && (
          <div className={`glass px-6 py-4 rounded-2xl border ${status.border} ${status.bg} flex flex-col items-center justify-center shrink-0`}>
            <img
              src={`/hourglass-${status.hourglassLevel}.svg`}
              alt={`Hourglass ${status.hourglassLevel}`}
              className="mb-1 h-8 w-8"
              style={{ filter: status.filter }}
            />
            <span className={`font-black ${status.color} text-lg`}>{status.label}</span>
            <span className="text-xs text-gray-400 max-w-[120px] text-center">{status.desc}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        
        {/* Coluna Principal */}
        <div className="space-y-8">
          {/* Main Visual */}
          <div className="rounded-2xl overflow-hidden aspect-video relative border border-gray-800 shadow-2xl bg-black">
            <img 
              src={game.background_image || 'https://via.placeholder.com/800x450'} 
              alt={game.name} 
              className="w-full h-full object-contain"
            />
          </div>

          {/* About this game */}
          <section className="glass p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
              <MessageSquareQuote className="text-primary" />
              About This Game
            </h2>
            <div className="prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-primary max-w-none">
              {cleanDesc ? (
                <div dangerouslySetInnerHTML={{ __html: cleanDesc }} />
              ) : (
                <p>Not available.</p>
              )}
            </div>
          </section>

          {/* User Reviews Section */}
          <section className="glass p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
              <Users className="text-primary" />
              Community Reviews
            </h2>

            <div className="space-y-6">
              {userReview && (
                <div className="bg-surface/50 p-5 rounded-xl border border-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{userReview.user?.username || 'You'}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(userReview.rating / 2) ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                          />
                        ))}
                        <span className="text-sm text-gray-300 ml-1">{userReview.rating}/10</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(userReview.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {userReview.playtime_hours && (
                    <div className="text-sm text-gray-400 mb-2">
                      Playtime: {userReview.playtime_hours} hours
                    </div>
                  )}

                  {userReview.review_text && (
                    <p className="text-gray-300 text-sm leading-relaxed">{userReview.review_text}</p>
                  )}
                </div>
              )}

              {!userReview && auth.isAuthenticated && (
                <div className="bg-surface/50 p-5 rounded-xl border border-gray-800 text-center">
                  <p className="text-gray-400">You haven't reviewed this game yet.</p>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="mt-3 px-4 py-2 bg-primary hover:bg-primaryHover text-white text-sm rounded-lg transition-colors"
                  >
                    Write a Review
                  </button>
                </div>
              )}

              {!auth.isAuthenticated && (
                <div className="bg-surface/50 p-5 rounded-xl border border-gray-800 text-center">
                  <p className="text-gray-400">
                    <Link to="/login" className="text-primary hover:text-primaryHover underline">Sign in</Link> to review this game
                  </p>
                </div>
              )}

              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : allReviews.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">{allReviews.length} reviews from the community</p>
                  {allReviews.map((review) => (
                    <div key={review.id} className="bg-surface/50 p-5 rounded-xl border border-gray-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{review.user?.username || 'Anonymous'}</span>
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
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {review.playtime_hours && (
                        <div className="text-sm text-gray-400 mb-2">
                          Playtime: {review.playtime_hours} hours
                        </div>
                      )}

                      {review.review_text && (
                        <p className="text-gray-300 text-sm leading-relaxed">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>No reviews yet. Be the first to review this game!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Coluna Sidebar Lateral (Estilo Steam) */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl sticky top-24">
            
            <div className="mb-6 space-y-4">
              {/* Avaliações Globais */}
              <div className="bg-surface/50 rounded-xl p-4 border border-gray-800">
                <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold block mb-1">Overall Reviews</span>
                <div className={`text-lg font-bold ${sentimentColor}`}>
                  {reviewSentiment}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ({reviewsCount.toLocaleString()} reviews)
                </div>
              </div>

              {/* Informações Steam-like */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Release Date:</span>
                  <span className="text-gray-300 font-medium">{releaseDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Developer:</span>
                  <span className="text-primary hover:underline cursor-pointer">
                    {game.developers && game.developers.length > 0 ? game.developers.join(', ') : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Publisher:</span>
                  <span className="text-primary hover:underline cursor-pointer">
                    {game.publishers && game.publishers.length > 0 ? game.publishers.join(', ') : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 border-t border-gray-800 pt-6">Manage on WastedHours</h3>
            <div className="space-y-3">
              {auth.isAuthenticated && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 mb-3 hover:-translate-y-0.5"
                >
                  <Star size={20} />
                  {userReview ? 'Update Review' : 'Rate Game'}
                </button>
              )}
              {auth.isAuthenticated && (
                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading || libraryLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all hover:-translate-y-0.5 ${
                    isInWishlist
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-surface hover:bg-gray-800 border border-gray-700 text-white'
                  } ${(wishlistLoading || libraryLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {wishlistLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Heart size={20} className={isInWishlist ? 'fill-current' : ''} />
                  )}
                  {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              )}
              {auth.isAuthenticated && (
                <button
                  onClick={handleLibraryToggle}
                  disabled={wishlistLoading || libraryLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all hover:-translate-y-0.5 ${
                    isInLibrary
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-surface hover:bg-gray-800 border border-gray-700 text-white'
                  } ${(wishlistLoading || libraryLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {libraryLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <BookOpen size={20} className={isInLibrary ? 'fill-current' : ''} />
                  )}
                  {isInLibrary ? 'Remover da Biblioteca' : 'Adicionar à Biblioteca'}
                </button>
              )}
              {!auth.isAuthenticated && (
                <div className="w-full text-center py-3.5 px-4 bg-surface border border-gray-700 rounded-xl text-gray-400">
                  <Link to="/login" className="text-primary hover:text-primaryHover underline">
                    Sign in to rate and manage games
                  </Link>
                </div>
              )}
            </div>

            {game.esrb_rating && (
              <div className="mt-8 pt-6 border-t border-gray-800 flex items-center gap-4">
                <div className="w-12 h-16 bg-gray-900 border border-gray-700 flex flex-col items-center justify-center rounded">
                  <span className="text-xs font-black text-white">{game.esrb_rating[0]}</span>
                </div>
                <div className="text-sm text-gray-400">ESRB Rating</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {userReview ? 'Update Your Review' : 'Rate This Game'}
                </h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleRatingSubmit} className="space-y-6">
                {/* Rating Stars */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Your Rating (1-10)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={ratingForm.rating}
                      onChange={(e) => handleRatingFormChange('rating', e.target.value)}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-white font-semibold min-w-[3rem] text-center">
                      {ratingForm.rating}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Playtime */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hours Played (optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25"
                    value={ratingForm.playtime_hours}
                    onChange={(e) => handleRatingFormChange('playtime_hours', e.target.value)}
                    className="w-full bg-surfaceHover border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Review (optional)
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Share your thoughts about this game..."
                    value={ratingForm.review_text}
                    onChange={(e) => handleRatingFormChange('review_text', e.target.value)}
                    className="w-full bg-surfaceHover border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 px-4 py-2 bg-surface border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ratingLoading}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {ratingLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Star size={16} />
                        {userReview ? 'Update Review' : 'Submit Review'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
