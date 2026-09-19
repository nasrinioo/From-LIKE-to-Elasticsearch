import { SearchService } from './search.service';
import { SearchResult } from './search.interface';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(query?: string, engine?: string, limitStr?: string, offsetStr?: string): Promise<SearchResult>;
    compare(query?: string): Promise<Record<string, SearchResult>>;
    runBenchmark(runs?: number): Promise<unknown>;
}
