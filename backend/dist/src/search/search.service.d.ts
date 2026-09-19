import { SearchOptions, SearchProvider, SearchResult } from './search.interface';
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
export declare class SearchService {
    private readonly likeProvider;
    private readonly ilikeProvider;
    private readonly trigramProvider;
    private readonly ftsProvider;
    private readonly elasticProvider;
    private readonly providers;
    constructor(likeProvider: LikeProvider, ilikeProvider: ILikeProvider, trigramProvider: TrigramProvider, ftsProvider: FtsProvider, elasticProvider: ElasticProvider);
    registerProvider(name: string, provider: SearchProvider): void;
    getProvider(name: string): SearchProvider | undefined;
    search(engine: string, query: string, options?: SearchOptions): Promise<SearchResult>;
    runBenchmark(runs?: number): Promise<BenchmarkReport[]>;
}
