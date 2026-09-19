"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FtsProvider = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let FtsProvider = class FtsProvider {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(query, options) {
        const limit = options?.limit || 10;
        const offset = options?.offset || 0;
        if (!query) {
            return {
                engine: 'fts',
                latencyMs: 0,
                totalHits: 0,
                items: [],
                queryInfo: { rawQuery: '' },
            };
        }
        const sqlQuery = `SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt",
       ts_rank(search_vector, websearch_to_tsquery('english', $1))::float as score,
       ts_headline('english', name, websearch_to_tsquery('english', $1), 'StartSel="<b class=""search-highlight"">", StopSel=</b>, HighlightAll=TRUE') as highlighted_name,
       ts_headline('english', description, websearch_to_tsquery('english', $1), 'StartSel="<b class=""search-highlight"">", StopSel=</b>, MaxWords=30, MinWords=15') as highlighted_desc
FROM products 
WHERE search_vector @@ websearch_to_tsquery('english', $1)
ORDER BY score DESC 
LIMIT $2 OFFSET $3`;
        const explainSql = `EXPLAIN SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt"
FROM products 
WHERE search_vector @@ websearch_to_tsquery('english', $1)`;
        const start = performance.now();
        const items = await this.prisma.$queryRawUnsafe(sqlQuery, query, limit, offset);
        const latencyMs = parseFloat((performance.now() - start).toFixed(2));
        const countResult = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM products WHERE search_vector @@ websearch_to_tsquery('english', $1)`, query);
        const totalHits = countResult[0]?.count || 0;
        let explainText = '';
        try {
            const explainResult = await this.prisma.$queryRawUnsafe(explainSql, query);
            explainText = explainResult
                .map((row) => {
                const plan = row['QUERY PLAN'];
                if (typeof plan === 'string')
                    return plan;
                const firstVal = Object.values(row)[0];
                return typeof firstVal === 'string'
                    ? firstVal
                    : JSON.stringify(firstVal ?? '');
            })
                .join('\n');
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            explainText = `Failed to get explain plan: ${errorMessage}`;
        }
        let tokens = [];
        try {
            const tokensResult = await this.prisma.$queryRawUnsafe(`SELECT websearch_to_tsquery('english', $1)::text as parsed_query`, query);
            if (tokensResult[0]?.parsed_query) {
                tokens = [tokensResult[0].parsed_query];
            }
        }
        catch {
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
            highlights: {
                name: item.highlighted_name ? [item.highlighted_name] : undefined,
                description: item.highlighted_desc
                    ? [item.highlighted_desc]
                    : undefined,
            },
        }));
        return {
            engine: 'fts',
            latencyMs,
            totalHits,
            items: formattedItems,
            queryInfo: {
                rawQuery: `SELECT id, name, description, brand, category, tags, price, rating, stock, "createdAt",
       ts_rank(search_vector, websearch_to_tsquery('english', '${query}')) as score,
       ts_headline('english', name, websearch_to_tsquery('english', '${query}'), 'StartSel="<b class=""search-highlight"">", StopSel=</b>, HighlightAll=TRUE') as highlighted_name
FROM products 
WHERE search_vector @@ websearch_to_tsquery('english', '${query}')
ORDER BY score DESC 
LIMIT ${limit} OFFSET ${offset};`,
                explainText,
                tokens,
            },
        };
    }
};
exports.FtsProvider = FtsProvider;
exports.FtsProvider = FtsProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FtsProvider);
//# sourceMappingURL=fts.provider.js.map