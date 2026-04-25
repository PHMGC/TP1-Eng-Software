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
      color: "text-gray-100",
      bg: "bg-primary/10",
      border: "border-primary/20",
      hourglassLevel: "full",
    };
  }
  
  if (numericScore >= 6.0) {
    return {
      label: "Solid Game",
      desc: "Worth your time",
      color: "text-gray-100",
      bg: "bg-primary/10",
      border: "border-primary/20",
      hourglassLevel: "half",
    };
  }

  return {
    label: "Sleep Fest",
    desc: "Certified snooze fest",
    color: "text-gray-100",
    bg: "bg-primary/10",
    border: "border-primary/20",
    hourglassLevel: "empty",
  };
};