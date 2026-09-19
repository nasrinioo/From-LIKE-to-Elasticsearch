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
exports.LikeProvider = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let LikeProvider = class LikeProvider {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(query, options) {
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
        const terms = query.split(/\s+/).filter(Boolean);
        const whereConditions = terms
            .map((_, index) => `(name LIKE $${index + 1} OR description LIKE $${index + 1})`)
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
        const items = await this.prisma.$queryRawUnsafe(sqlQuery, ...queryArgs);
        const latencyMs = parseFloat((performance.now() - start).toFixed(2));
        const countResult = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM products WHERE ${whereConditions}`, ...countQueryArgs);
        const totalHits = countResult[0]?.count || 0;
        let explainText = '';
        try {
            const explainResult = await this.prisma.$queryRawUnsafe(explainSql, ...countQueryArgs);
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
};
exports.LikeProvider = LikeProvider;
exports.LikeProvider = LikeProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LikeProvider);
//# sourceMappingURL=like.provider.js.map