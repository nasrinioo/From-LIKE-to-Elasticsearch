import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchResult } from './search.interface';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') query: string = '',
    @Query('engine') engine: string = 'like',
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ): Promise<SearchResult> {
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    if (isNaN(limit) || limit < 0) {
      throw new BadRequestException('Limit must be a non-negative number');
    }
    if (isNaN(offset) || offset < 0) {
      throw new BadRequestException('Offset must be a non-negative number');
    }

    return this.searchService.search(engine, query, { limit, offset });
  }

  @Get('compare')
  async compare(
    @Query('q') query: string = '',
  ): Promise<Record<string, SearchResult>> {
    const engines = ['like', 'ilike', 'trigram', 'fts', 'elasticsearch'];
    const promises = engines.map(async (engine) => {
      try {
        return {
          engine,
          result: await this.searchService.search(engine, query, { limit: 15 }),
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
          engine,
          result: {
            engine,
            latencyMs: 0,
            totalHits: 0,
            items: [],
            queryInfo: {
              rawQuery: '',
              explainText: `Error executing ${engine}: ${errorMessage}`,
            },
          },
        };
      }
    });

    const resultsList = await Promise.all(promises);
    const resultsMap: Record<string, SearchResult> = {};
    for (const item of resultsList) {
      resultsMap[item.engine] = item.result;
    }
    return resultsMap;
  }

  @Post('benchmark')
  async runBenchmark(@Body('runs') runs?: number): Promise<unknown> {
    const runsCount = runs || 20;
    return this.searchService.runBenchmark(runsCount);
  }
}
