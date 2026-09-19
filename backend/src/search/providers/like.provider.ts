import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  SearchOptions,
  SearchProvider,
  SearchResult,
} from '../search.interface';

interface RawProductRow {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  rating: number;
  stock: number;
}

interface CountRow {
  count: number;
}

interface ExplainRow {
  'QUERY PLAN'?: string;
  [key: string]: unknown;
}

@Injectable()
export class LikeProvider implements SearchProvider {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;

    if (!query) {
      return {
        engine: 'like',
        latencyMs: 0,
        totalHits: 0,
        items: [],
        queryInfo: { rawQuery: '' },
      };
    }

    // Split search input into terms (e.g. "Apple laptop" -> ["Apple", "laptop"])
    const terms = query.split(/\s+/).filter(Boolean);
    const whereConditions = terms
      .map(
        (_, index) =>
          `(name LIKE $${index + 1} OR description LIKE $${index + 1})`,
      )
      .join(' AND ');
    const termParams = terms.map((term) => `%${term}%`);

    const sqlQuery = `SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt" 
FROM products 
WHERE ${whereConditions} 
LIMIT $${terms.length + 1} OFFSET $${terms.length + 2}`;

    const explainSql = `EXPLAIN SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt" 
FROM products 
WHERE ${whereConditions}`;

    const queryArgs = [...termParams, limit, offset];
    const countQueryArgs = [...termParams];

    const start = performance.now();
    const items = await this.prisma.$queryRawUnsafe<RawProductRow[]>(
      sqlQuery,
      ...queryArgs,
    );
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));

    // Get count for hits
    const countResult = await this.prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*)::int as count FROM products WHERE ${whereConditions}`,
      ...countQueryArgs,
    );
    const totalHits = countResult[0]?.count || 0;

    // Get explain plan
    let explainText = '';
    try {
      const explainResult = await this.prisma.$queryRawUnsafe<ExplainRow[]>(
        explainSql,
        ...countQueryArgs,
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
      score: undefined,
    }));

    const rawQueryDisplay = `SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt" 
FROM products 
WHERE ${terms.map((t) => `(name LIKE '%${t}%' OR description LIKE '%${t}%')`).join(' AND ')} 
LIMIT ${limit} OFFSET ${offset};`;

    return {
      engine: 'like',
      latencyMs,
      totalHits,
      items: formattedItems,
      queryInfo: {
        rawQuery: rawQueryDisplay,
        explainText,
      },
    };
  }
}
