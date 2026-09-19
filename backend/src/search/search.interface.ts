export interface SearchItem {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  stock: number;
  score?: number;
  highlights?: {
    name?: string[];
    description?: string[];
  };
}

export interface SearchResult {
  engine: string;
  latencyMs: number;
  totalHits: number;
  items: SearchItem[];
  queryInfo: {
    rawQuery: string;
    explainText?: string;
    tokens?: string[];
  };
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
}

export interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult>;
}
