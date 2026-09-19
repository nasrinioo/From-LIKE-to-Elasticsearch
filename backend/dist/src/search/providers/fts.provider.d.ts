import { PrismaService } from '../../prisma.service';
import { SearchOptions, SearchProvider, SearchResult } from '../search.interface';
export declare class FtsProvider implements SearchProvider {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(query: string, options?: SearchOptions): Promise<SearchResult>;
}
