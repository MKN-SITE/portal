export const optimizeImage = (url: string | undefined | null, width: number = 96): string | undefined => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // If external image service supports width parameter (e.g., higgs/cloudfront or wp mshots), adjust width
  try {
    if (trimmed.includes('images.higgs.ai') || trimmed.includes('s0.wp.com/mshots')) {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('w', String(width));
      return parsed.toString();
    }
  } catch {
    // Fallback to raw URL if relative path or invalid URL
  }

  return trimmed;
};
