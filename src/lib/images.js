const IMAGE_BASE = "https://image.tmdb.org/t/p/";

export function getPoster(movie, size = "w342") {
  if (!movie) return "";

  if (movie.poster_path) return `${IMAGE_BASE}${size}${movie.poster_path}`;

  return (
    movie.medium_cover_image ||
    movie.large_cover_image ||
    movie.poster ||
    movie.posterUrl ||
    movie.image ||
    ""
  );
}

export function getBackdrop(movie, size = "w1280") {
  if (!movie) return "";

  if (movie.backdrop_path) return `${IMAGE_BASE}${size}${movie.backdrop_path}`;

  return (
    movie.background_image_original ||
    movie.background_image ||
    movie.large_cover_image ||
    movie.medium_cover_image ||
    ""
  );
}
