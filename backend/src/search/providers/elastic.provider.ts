import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import {
  SearchOptions,
  SearchProvider,
  SearchResult,
} from '../search.interface';

interface ProductSource {
  name: string;
  description: string;
  brand: string;
  category: string;
  tags?: string[];
  price: number;
  rating: number;
  stock: number;
}

interface EsHit {
  _id: string;
  _score: number;
  _source: ProductSource;
  highlight?: {
    name?: string[];
    description?: string[];
  };
}

interface EsSearchResponse {
  hits: {
    total: number | { value: number };
    hits: EsHit[];
  };
}

interface EsAnalyzeToken {
  token: string;
}

interface EsAnalyzeResponse {
  tokens?: EsAnalyzeToken[];
}

@Injectable()
export class ElasticProvider implements SearchProvider {
  private readonly esClient: Client;

  constructor() {
    this.esClient = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    });
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    if (!query) {
      return {
        engine: 'elasticsearch',
        latencyMs: 0,
        totalHits: 0,
        items: [],
        queryInfo: { rawQuery: '' },
      };
    }

    const esQuery = {
      from: offset,
      size: limit,
      track_total_hits: true,
      query: {
        multi_match: {
          query: query,
          fields: ['name^4', 'name.suggest^2', 'description'],
          fuzziness: 'AUTO',
          operator: 'or',
          minimum_should_match: '2<75%',
        },
      },
      highlight: {
        pre_tags: ['<b class="search-highlight">'],
        post_tags: ['</b>'],
        fields: {
          name: {},
          description: {},
        },
      },
    };

    const start = performance.now();
    let response: EsSearchResponse;
    try {
      response = (await this.esClient.search({
        index: 'products',
        ...esQuery,
      })) as unknown as EsSearchResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        engine: 'elasticsearch',
        latencyMs: 0,
        totalHits: 0,
        items: [],
        queryInfo: {
          rawQuery: JSON.stringify(esQuery, null, 2),
          explainText: `Elasticsearch error: ${errorMessage}`,
        },
      };
    }
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));

    const hitsInfo = response.hits;
    const totalHits =
      typeof hitsInfo.total === 'object'
        ? hitsInfo.total.value
        : hitsInfo.total || 0;

    const formattedItems = (hitsInfo.hits || []).map((hit: EsHit) => {
      const doc = hit._source;
      return {
        id: hit._id,
        name: doc.name,
        description: doc.description,
        brand: doc.brand,
        category: doc.category,
        tags: doc.tags || [],
        price: Number(doc.price),
        rating: Number(doc.rating),
        stock: Number(doc.stock),
        score: Number(hit._score),
        highlights: hit.highlight
          ? {
              name: hit.highlight.name,
              description: hit.highlight.description,
            }
          : undefined,
      };
    });

    // Retrieve tokens for explanation
    let tokens: string[] = [];
    try {
      const analyzeResponse = (await this.esClient.indices.analyze({
        index: 'products',
        text: query,
        analyzer: 'standard',
      })) as unknown as EsAnalyzeResponse;
      tokens =
        analyzeResponse.tokens?.map((t: EsAnalyzeToken) => t.token) || [];
    } catch {
      // fallback
    }

    return {
      engine: 'elasticsearch',
      latencyMs,
      totalHits,
      items: formattedItems,
      queryInfo: {
        rawQuery: JSON.stringify(esQuery, null, 2),
        explainText: `Elasticsearch BM25 Search. Matches are scored using TF-IDF/BM25 formula with term frequency and document length normalization. Fields used: name (boost: 3), name.suggest (edge N-grams, boost: 2), description.`,
        tokens,
      },
    };
  }
}
