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
exports.ElasticProvider = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@elastic/elasticsearch");
let ElasticProvider = class ElasticProvider {
    esClient;
    constructor() {
        this.esClient = new elasticsearch_1.Client({
            node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        });
    }
    async search(query, options) {
        const limit = options?.limit || 10;
        const offset = options?.offset || 0;
        if (!query) {
            return {
                engine: 'elasticsearch',
                latencyMs: 0,
                totalHits: 0,
                items: [],
                queryInfo: { rawQuery: '' },
            };
        }
        const esQuery = {
            from: offset,
            size: limit,
            track_total_hits: true,
            query: {
                multi_match: {
                    query: query,
                    fields: ['name^4', 'name.suggest^2', 'description'],
                    fuzziness: 'AUTO',
                    operator: 'or',
                    minimum_should_match: '2<75%',
                },
            },
            highlight: {
                pre_tags: ['<b class="search-highlight">'],
                post_tags: ['</b>'],
                fields: {
                    name: {},
                    description: {},
                },
            },
        };
        const start = performance.now();
        let response;
        try {
            response = (await this.esClient.search({
                index: 'products',
                ...esQuery,
            }));
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            return {
                engine: 'elasticsearch',
                latencyMs: 0,
                totalHits: 0,
                items: [],
                queryInfo: {
                    rawQuery: JSON.stringify(esQuery, null, 2),
                    explainText: `Elasticsearch error: ${errorMessage}`,
                },
            };
        }
        const latencyMs = parseFloat((performance.now() - start).toFixed(2));
        const hitsInfo = response.hits;
        const totalHits = typeof hitsInfo.total === 'object'
            ? hitsInfo.total.value
            : hitsInfo.total || 0;
        const formattedItems = (hitsInfo.hits || []).map((hit) => {
            const doc = hit._source;
            return {
                id: hit._id,
                name: doc.name,
                description: doc.description,
                brand: doc.brand,
                category: doc.category,
                tags: doc.tags || [],
                price: Number(doc.price),
                rating: Number(doc.rating),
                stock: Number(doc.stock),
                score: Number(hit._score),
                highlights: hit.highlight
                    ? {
                        name: hit.highlight.name,
                        description: hit.highlight.description,
                    }
                    : undefined,
            };
        });
        let tokens = [];
        try {
            const analyzeResponse = (await this.esClient.indices.analyze({
                index: 'products',
                text: query,
                analyzer: 'standard',
            }));
            tokens =
                analyzeResponse.tokens?.map((t) => t.token) || [];
        }
        catch {
        }
        return {
            engine: 'elasticsearch',
            latencyMs,
            totalHits,
            items: formattedItems,
            queryInfo: {
                rawQuery: JSON.stringify(esQuery, null, 2),
                explainText: `Elasticsearch BM25 Search. Matches are scored using TF-IDF/BM25 formula with term frequency and document length normalization. Fields used: name (boost: 3), name.suggest (edge N-grams, boost: 2), description.`,
                tokens,
            },
        };
    }
};
exports.ElasticProvider = ElasticProvider;
exports.ElasticProvider = ElasticProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ElasticProvider);
//# sourceMappingURL=elastic.provider.js.map