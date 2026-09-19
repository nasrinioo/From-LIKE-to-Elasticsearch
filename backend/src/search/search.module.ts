import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { LikeProvider } from './providers/like.provider';
import { ILikeProvider } from './providers/ilike.provider';
import { TrigramProvider } from './providers/trigram.provider';
import { FtsProvider } from './providers/fts.provider';
import { ElasticProvider } from './providers/elastic.provider';

@Module({
  controllers: [SearchController],
  providers: [
    PrismaService,
    SearchService,
    LikeProvider,
    ILikeProvider,
    TrigramProvider,
    FtsProvider,
    ElasticProvider,
  ],
  exports: [SearchService, PrismaService],
})
export class SearchModule {}
