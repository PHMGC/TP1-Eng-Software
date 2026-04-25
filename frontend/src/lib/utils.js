export const calculateScore = (game) => {
  const rating = game.rating || 0;
  const base = rating * 1.5;
  const playtimeBonus = Math.min(2.5, (game.playtime || 0) / 20);
  return (base + playtimeBonus).toFixed(1);
};

/**
 * Define o status de "Tempo Gasto" baseado na nota final.
 * Você pode ajustar os limites (8.5, 6.0) conforme desejar.
 */
export const getWastedTimeStatus = (score) => {
  const numericScore = parseFloat(score);

  if (numericScore >= 8.5) {
    return {
      label: "Masterpiece",
      desc: "Sleep is for the weak",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
      hourglassLevel: "full",
      filter: "invert(45%) sepia(93%) saturate(1450%) hue-rotate(215deg) brightness(98%) contrast(92%)", // Roxo (~#6366f1)
    };
  }
  
  if (numericScore >= 6.0) {
    return {
      label: "Solid Game",
      desc: "Worth your time",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      hourglassLevel: "half",
      filter: "invert(72%) sepia(35%) saturate(836%) hue-rotate(110deg) brightness(96%) contrast(92%)", // Verde (~#34d399)
    };
  }

  return {
    label: "Sleep Fest",
    desc: "Certified snooze fest",
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
    hourglassLevel: "empty",
    filter: "invert(63%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(92%) contrast(88%)", // Cinza (~#9ca3af)
  };
};