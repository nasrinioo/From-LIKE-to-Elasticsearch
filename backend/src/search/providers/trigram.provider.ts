import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  SearchOptions,
  SearchProvider,
  SearchResult,
} from '../search.interface';

interface RawTrigramRow {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  stock: number;
  score: number;
}

interface CountRow {
  count: number;
}

interface ExplainRow {
  'QUERY PLAN'?: string;
  [key: string]: unknown;
}

@Injectable()
export class TrigramProvider implements SearchProvider {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    if (!query) {
      return {
        engine: 'trigram',
        latencyMs: 0,
        totalHits: 0,
        items: [],
        queryInfo: { rawQuery: '' },
      };
    }

    const sqlQuery = `SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt",
       GREATEST(similarity(name, $1), similarity(description, $1))::float as score
FROM products 
WHERE name % $1 OR description % $1
ORDER BY score DESC 
LIMIT $2 OFFSET $3`;

    const explainSql = `EXPLAIN SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt",
       GREATEST(similarity(name, $1), similarity(description, $1))::float as score
FROM products 
WHERE name % $1 OR description % $1`;

    const start = performance.now();
    const items = await this.prisma.$queryRawUnsafe<RawTrigramRow[]>(
      sqlQuery,
      query,
      limit,
      offset,
    );
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));

    // Get count for hits
    const countResult = await this.prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*)::int as count FROM products WHERE name % $1 OR description % $1`,
      query,
    );
    const totalHits = countResult[0]?.count || 0;

    // Get explain plan
    let explainText = '';
    try {
      const explainResult = await this.prisma.$queryRawUnsafe<ExplainRow[]>(
        explainSql,
        query,
      );
      explainText = explainResult
        .map((row) => {
          const plan = row['QUERY PLAN'];
          if (typeof plan === 'string') return plan;
          const firstVal = Object.values(row)[0];
          return typeof firstVal === 'string'
            ? firstVal
            : JSON.stringify(firstVal ?? '');
        })
        .join('\n');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      explainText = `Failed to get explain plan: ${errorMessage}`;
    }

    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      brand: item.brand,
      category: item.category,
      tags: item.tags || [],
      price: Number(item.price),
      rating: Number(item.rating),
      stock: Number(item.stock),
      score: Number(item.score),
    }));

    return {
      engine: 'trigram',
      latencyMs,
      totalHits,
      items: formattedItems,
      queryInfo: {
        rawQuery: `SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt",
       GREATEST(similarity(name, '${query}'), similarity(description, '${query}')) as score
FROM products 
WHERE name % '${query}' OR description % '${query}'
ORDER BY score DESC 
LIMIT ${limit} OFFSET ${offset};`,
        explainText,
      },
    };
  }
}
