export const DEFAULT_LIMIT = 20;

export const SORT_OPTIONS = [
  { value: 'wasted_score', label: 'Wasted Score (Best First)' },
  { value: 'trending', label: 'Trending' },
  { value: 'rating_desc', label: 'Rating: High to Low' },
  { value: 'rating_asc', label: 'Rating: Low to High' },
  { value: 'playtime_desc', label: 'Playtime: High to Low' },
  { value: 'playtime_asc', label: 'Playtime: Low to High' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];

export const parseFiltersFromSearchParams = (searchParams) => ({
  search: searchParams.get('search') || '',
  genre: searchParams.get('genre') || '',
  sort: searchParams.get('sort') || 'wasted_score',
  page: Math.max(1, Number(searchParams.get('page')) || 1),
  limit: DEFAULT_LIMIT,
});

export const buildSearchParamsFromFilters = (filters) => {
  const params = new URLSearchParams();
  const entries = [
    ['search', filters.search],
    ['genre', filters.genre],
    ['sort', filters.sort],
    ['page', filters.page],
    ['limit', DEFAULT_LIMIT],
  ];

  entries.forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });

  return params;
};
