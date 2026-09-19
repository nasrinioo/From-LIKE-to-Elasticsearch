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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const search_service_1 = require("./search.service");
let SearchController = class SearchController {
    searchService;
    constructor(searchService) {
        this.searchService = searchService;
    }
    async search(query = '', engine = 'like', limitStr, offsetStr) {
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
        if (isNaN(limit) || limit < 0) {
            throw new common_1.BadRequestException('Limit must be a non-negative number');
        }
        if (isNaN(offset) || offset < 0) {
            throw new common_1.BadRequestException('Offset must be a non-negative number');
        }
        return this.searchService.search(engine, query, { limit, offset });
    }
    async compare(query = '') {
        const engines = ['like', 'ilike', 'trigram', 'fts', 'elasticsearch'];
        const promises = engines.map(async (engine) => {
            try {
                return {
                    engine,
                    result: await this.searchService.search(engine, query, { limit: 15 }),
                };
            }
            catch (err) {
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
        const resultsMap = {};
        for (const item of resultsList) {
            resultsMap[item.engine] = item.result;
        }
        return resultsMap;
    }
    async runBenchmark(runs) {
        const runsCount = runs || 20;
        return this.searchService.runBenchmark(runsCount);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('engine')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('compare'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "compare", null);
__decorate([
    (0, common_1.Post)('benchmark'),
    __param(0, (0, common_1.Body)('runs')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "runBenchmark", null);
exports.SearchController = SearchController = __decorate([
    (0, common_1.Controller)('api/search'),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map