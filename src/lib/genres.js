const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export function getMovieGenres(movie) {
  if (!movie) return [];
  const g = movie.genres;

  if (Array.isArray(g)) {
    const out = g
      .map((x) => {
        if (!x) return null;
        if (typeof x === "string") return x;
        if (typeof x?.name === "string") return x.name;
        return null;
      })
      .filter(Boolean);
    return out;
  }

  if (typeof g === "string") return [g];

  const ids = movie.genre_ids || movie.genreIds;
  if (Array.isArray(ids)) {
    return ids
      .map((id) => GENRE_MAP[id])
      .filter(Boolean);
  }

  return [];
}

export const CURATION = [
  { key: "Dark", title: "오늘의 다크 무드", subtitle: "스릴/범죄/미스터리 쪽으로 쫙", include: ["Thriller", "Crime", "Mystery", "Horror"] },
  { key: "Laugh", title: "가볍게 웃고 가자", subtitle: "코미디/가족/로맨스 위주", include: ["Comedy", "Family", "Romance"] },
  { key: "Epic", title: "스케일 크게", subtitle: "액션/어드벤처/판타지", include: ["Action", "Adventure", "Fantasy"] },
  { key: "Mind", title: "머리 쓰는 날", subtitle: "드라마/역사/전쟁", include: ["Drama", "History", "War"] },
  { key: "Future", title: "SF/애니 픽", subtitle: "현실 도망치기 딱", include: ["Sci-Fi", "Animation"] },
];
