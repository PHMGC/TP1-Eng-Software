import { Link } from 'react-router-dom';

export default function GameCard({ game }) {
  // Configurações e falbacks caso os dados não existam
  const rating = game.rating || 0;

  // Total de avaliações (somando as contagens de cada distribuição de notas, se houver)
  const reviewsCount = game.ratings_distribution ?
    game.ratings_distribution.reduce((acc, r) => acc + (r.count || 0), 0) : 100;

  const imageUrl = game.background_image || 'https://via.placeholder.com/400x225?text=Sem+Imagem';

  // A formula única do WastedHours: Nota base (x1.5 = max 7.5) + Bônus de tempo (max 2.5 pra +50h)
  const calculateScore = () => {
    const base = rating * 1.5;
    const playtimeBonus = Math.min(2.5, (game.playtime || 0) / 20);
    return (base + playtimeBonus).toFixed(1);
  };
  const finalScore = calculateScore();

  function getBadgeIcon(score) {
    if (score >= 8.5) return "🤩";
    if (score >= 6.0) return "👍";
    return "🛌";
  }
  const badgeIcon = getBadgeIcon(parseFloat(finalScore));

  return (
    <Link to={`/game/${game.id}`} className="group relative rounded-xl overflow-hidden bg-surface hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border border-gray-800 hover:border-gray-700 flex flex-col h-full transform hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        <img
          src={imageUrl}
          alt={game.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-in-out"
          loading="lazy"
        />
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 relative">
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {game.name}
        </h3>

        {/* Info badges */}
        <div className="flex items-center mt-auto">
          <div className="flex items-center gap-2 justify-center bg-surfaceHover px-2.5 py-1 rounded-md border border-gray-800/50" title={`Rating: ${rating.toFixed(1)} / Playtime: ${game.playtime || 0}h`}>
            <span className="text-lg leading-none">{badgeIcon}</span>
            <span className="text-sm font-bold text-gray-300">{finalScore}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
