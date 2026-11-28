export interface LocalDiscoverySuggestion {
  id: string;
  symbol: string;
  title: string;
  description: string;
}
export function getLocalDiscoverySuggestions(locale?: 'ar' | 'fr'): LocalDiscoverySuggestion[];
