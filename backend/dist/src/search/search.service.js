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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const like_provider_1 = require("./providers/like.provider");
const ilike_provider_1 = require("./providers/ilike.provider");
const trigram_provider_1 = require("./providers/trigram.provider");
const fts_provider_1 = require("./providers/fts.provider");
const elastic_provider_1 = require("./providers/elastic.provider");
let SearchService = class SearchService {
    likeProvider;
    ilikeProvider;
    trigramProvider;
    ftsProvider;
    elasticProvider;
    providers = new Map();
    constructor(likeProvider, ilikeProvider, trigramProvider, ftsProvider, elasticProvider) {
        this.likeProvider = likeProvider;
        this.ilikeProvider = ilikeProvider;
        this.trigramProvider = trigramProvider;
        this.ftsProvider = ftsProvider;
        this.elasticProvider = elasticProvider;
        this.providers.set('like', this.likeProvider);
        this.providers.set('ilike', this.ilikeProvider);
        this.providers.set('trigram', this.trigramProvider);
        this.providers.set('fts', this.ftsProvider);
        this.providers.set('elasticsearch', this.elasticProvider);
    }
    registerProvider(name, provider) {
        this.providers.set(name, provider);
    }
    getProvider(name) {
        return this.providers.get(name);
    }
    async search(engine, query, options) {
        const provider = this.providers.get(engine.toLowerCase());
        if (!provider) {
            throw new common_1.BadRequestException(`Search engine '${engine}' is not supported or registered.`);
        }
        const trimmedQuery = (query || '').trim();
        return provider.search(trimmedQuery, options);
    }
    async runBenchmark(runs = 20) {
        const TEST_QUERIES = [
            'iPhone',
            'running shoes',
            'laptop',
            'wireless',
            'leather',
            'Samsung',
            'Sony',
            'waterproof',
            'jacket',
            'premium',
            'backpack',
            'smartwatch',
            'headphones',
            'vacuum',
            'purifier',
            'Nike',
            'Adidas',
            'jeans',
            'kettle',
            'blender',
        ];
        const queries = [];
        while (queries.length < runs) {
            queries.push(...TEST_QUERIES);
        }
        const finalQueries = queries.slice(0, runs);
        const engines = ['like', 'ilike', 'trigram', 'fts', 'elasticsearch'];
        const reports = [];
        for (const engine of engines) {
            const latencies = [];
            try {
                await this.search(engine, 'apple', { limit: 10 });
            }
            catch {
            }
            for (const query of finalQueries) {
                try {
                    const res = await this.search(engine, query, { limit: 10 });
                    latencies.push(res.latencyMs);
                }
                catch {
                }
            }
            const sorted = [...latencies].sort((a, b) => a - b);
            const total = latencies.length;
            const sum = latencies.reduce((a, b) => a + b, 0);
            const avg = total > 0 ? parseFloat((sum / total).toFixed(2)) : 0;
            const min = total > 0 ? sorted[0] : 0;
            const max = total > 0 ? sorted[total - 1] : 0;
            const p50 = total > 0 ? sorted[Math.floor(total * 0.5)] : 0;
            const p90 = total > 0 ? sorted[Math.floor(total * 0.9)] : 0;
            const p99 = total > 0 ? sorted[Math.floor(total * 0.99)] : 0;
            reports.push({
                engine,
                totalQueries: total,
                avg,
                min,
                max,
                p50,
                p90,
                p99,
            });
        }
        return reports;
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [like_provider_1.LikeProvider,
        ilike_provider_1.ILikeProvider,
        trigram_provider_1.TrigramProvider,
        fts_provider_1.FtsProvider,
        elastic_provider_1.ElasticProvider])
], SearchService);
//# sourceMappingURL=search.service.js.map