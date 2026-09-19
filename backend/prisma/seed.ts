import { PrismaClient } from '@prisma/client';
import { Client } from '@elastic/elasticsearch';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateProducts } from './generators/product.generator';
import { setupElasticIndex, bulkIndexElastic } from './elastic/indexer';
import { PseudoRandom } from './generators/random.utils';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5433/search_evolution?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

async function main() {
  console.log('--- Cleaning Up Database ---');
  await prisma.product.deleteMany({});
  console.log('PostgreSQL table cleared.');

  console.log('--- Cleaning Up & Setting Up Elasticsearch ---');
  await setupElasticIndex(esClient);

  const TOTAL_PRODUCTS = 200000;
  const BATCH_SIZE = 5000;
  const rng = new PseudoRandom(12345); // Deterministic seed

  console.log(
    `--- Seeding ${TOTAL_PRODUCTS} Products in batches of ${BATCH_SIZE} ---`,
  );

  for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
    // Generate batch with deterministic PRNG
    const batch = generateProducts(BATCH_SIZE, rng);

    // Seed PostgreSQL
    await prisma.product.createMany({
      data: batch,
    });

    // Seed Elasticsearch
    await bulkIndexElastic(esClient, batch);
    console.log(
      `Successfully Seeded Batch: ${i + batch.length} / ${TOTAL_PRODUCTS} products`,
    );
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
