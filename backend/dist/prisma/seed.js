"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const elasticsearch_1 = require("@elastic/elasticsearch");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const product_generator_1 = require("./generators/product.generator");
const indexer_1 = require("./elastic/indexer");
const random_utils_1 = require("./generators/random.utils");
const connectionString = process.env.DATABASE_URL ||
    'postgresql://postgres:postgrespassword@localhost:5433/search_evolution?schema=public';
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const esClient = new elasticsearch_1.Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});
async function main() {
    console.log('--- Cleaning Up Database ---');
    await prisma.product.deleteMany({});
    console.log('PostgreSQL table cleared.');
    console.log('--- Cleaning Up & Setting Up Elasticsearch ---');
    await (0, indexer_1.setupElasticIndex)(esClient);
    const TOTAL_PRODUCTS = 200000;
    const BATCH_SIZE = 5000;
    const rng = new random_utils_1.PseudoRandom(12345);
    console.log(`--- Seeding ${TOTAL_PRODUCTS} Products in batches of ${BATCH_SIZE} ---`);
    for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
        const batch = (0, product_generator_1.generateProducts)(BATCH_SIZE, rng);
        await prisma.product.createMany({
            data: batch,
        });
        await (0, indexer_1.bulkIndexElastic)(esClient, batch);
        console.log(`Successfully Seeded Batch: ${i + batch.length} / ${TOTAL_PRODUCTS} products`);
    }
    console.log('--- Refreshing Elasticsearch Index ---');
    await esClient.indices.refresh({ index: 'products' });
    console.log('Elasticsearch index refreshed.');
    console.log('Seeding Completed Successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map