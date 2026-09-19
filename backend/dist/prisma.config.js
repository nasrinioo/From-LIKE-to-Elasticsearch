"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env["DATABASE_URL"] ||
            "postgresql://postgres:postgrespassword@localhost:5433/search_evolution?schema=public",
    },
});
//# sourceMappingURL=prisma.config.js.map