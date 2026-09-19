"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const search_controller_1 = require("./search.controller");
const search_service_1 = require("./search.service");
const like_provider_1 = require("./providers/like.provider");
const ilike_provider_1 = require("./providers/ilike.provider");
const trigram_provider_1 = require("./providers/trigram.provider");
const fts_provider_1 = require("./providers/fts.provider");
const elastic_provider_1 = require("./providers/elastic.provider");
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Module)({
        controllers: [search_controller_1.SearchController],
        providers: [
            prisma_service_1.PrismaService,
            search_service_1.SearchService,
            like_provider_1.LikeProvider,
            ilike_provider_1.ILikeProvider,
            trigram_provider_1.TrigramProvider,
            fts_provider_1.FtsProvider,
            elastic_provider_1.ElasticProvider,
        ],
        exports: [search_service_1.SearchService, prisma_service_1.PrismaService],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map