export const getDefaultAvatarUrl = (seed?: string | null) => {
  const normalizedSeed = (seed || "collabio-user").trim();
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedSeed)}`;
};
