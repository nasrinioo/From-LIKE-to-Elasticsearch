import { SearchOptions, SearchProvider, SearchResult } from '../search.interface';
export declare class ElasticProvider implements SearchProvider {
    private readonly esClient;
    constructor();
    search(query: string, options?: SearchOptions): Promise<SearchResult>;
}
