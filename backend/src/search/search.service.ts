import { Injectable, BadRequestException } from '@nestjs/common';
import {
  SearchOptions,
  SearchProvider,
  SearchResult,
} from './search.interface';
import { LikeProvider } from './providers/like.provider';
import { ILikeProvider } from './providers/ilike.provider';
import { TrigramProvider } from './providers/trigram.provider';
import { FtsProvider } from './providers/fts.provider';
import { ElasticProvider } from './providers/elastic.provider';

export interface BenchmarkReport {
  engine: string;
  totalQueries: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p99: number;
}

@Injectable()
export class SearchService {
  private readonly providers = new Map<string, SearchProvider>();

  constructor(
    private readonly likeProvider: LikeProvider,
    private readonly ilikeProvider: ILikeProvider,
    private readonly trigramProvider: TrigramProvider,
    private readonly ftsProvider: FtsProvider,
    private readonly elasticProvider: ElasticProvider,
  ) {
    this.providers.set('like', this.likeProvider);
    this.providers.set('ilike', this.ilikeProvider);
    this.providers.set('trigram', this.trigramProvider);
    this.providers.set('fts', this.ftsProvider);
    this.providers.set('elasticsearch', this.elasticProvider);
  }

  registerProvider(name: string, provider: SearchProvider) {
    this.providers.set(name, provider);
  }

  getProvider(name: string): SearchProvider | undefined {
    return this.providers.get(name);
  }

  async search(
    engine: string,
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult> {
    const provider = this.providers.get(engine.toLowerCase());
    if (!provider) {
      throw new BadRequestException(
        `Search engine '${engine}' is not supported or registered.`,
      );
    }

    // Trim query to handle whitespace-only entries gracefully
    const trimmedQuery = (query || '').trim();
    return provider.search(trimmedQuery, options);
  }

  async runBenchmark(runs: number = 20): Promise<BenchmarkReport[]> {
    const TEST_QUERIES = [
      'iPhone',
      'running shoes',
      'laptop',
      'wireless',
      'leather',
      'Samsung',
      'Sony',
      'waterproof',
      'jacket',
      'premium',
      'backpack',
      'smartwatch',
      'headphones',
      'vacuum',
      'purifier',
      'Nike',
      'Adidas',
      'jeans',
      'kettle',
      'blender',
    ];

    const queries: string[] = [];
    while (queries.length < runs) {
      queries.push(...TEST_QUERIES);
    }
    const finalQueries = queries.slice(0, runs);

    const engines = ['like', 'ilike', 'trigram', 'fts', 'elasticsearch'];
    const reports: BenchmarkReport[] = [];

    for (const engine of engines) {
      const latencies: number[] = [];

      // Warm up query
      try {
        await this.search(engine, 'apple', { limit: 10 });
      } catch {
        // Ignore warmup errors
      }

      for (const query of finalQueries) {
        try {
          const res = await this.search(engine, query, { limit: 10 });
          latencies.push(res.latencyMs);
        } catch {
          // Ignore individual query errors during benchmark
        }
      }

      const sorted = [...latencies].sort((a, b) => a - b);
      const total = latencies.length;
      const sum = latencies.reduce((a, b) => a + b, 0);

      const avg = total > 0 ? parseFloat((sum / total).toFixed(2)) : 0;
      const min = total > 0 ? sorted[0] : 0;
      const max = total > 0 ? sorted[total - 1] : 0;
      const p50 = total > 0 ? sorted[Math.floor(total * 0.5)] : 0;
      const p90 = total > 0 ? sorted[Math.floor(total * 0.9)] : 0;
      const p99 = total > 0 ? sorted[Math.floor(total * 0.99)] : 0;

      reports.push({
        engine,
        totalQueries: total,
        avg,
        min,
        max,
        p50,
        p90,
        p99,
      });
    }

    return reports;
  }
}
