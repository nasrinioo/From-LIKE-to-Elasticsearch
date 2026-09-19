import { Client } from '@elastic/elasticsearch';
import { SeedProduct } from '../generators/product.generator';

export async function setupElasticIndex(esClient: Client): Promise<void> {
  const indexExists = await esClient.indices.exists({ index: 'products' });
  if (indexExists) {
    await esClient.indices.delete({ index: 'products' });
    console.log('Elasticsearch index deleted.');
  }

  console.log('--- Creating Elasticsearch Index Settings & Mappings ---');
  await esClient.indices.create({
    index: 'products',
    settings: {
      analysis: {
        analyzer: {
          autocomplete: {
            type: 'custom',
            tokenizer: 'autocomplete_tokenizer',
            filter: ['lowercase'],
          },
          autocomplete_search: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase'],
          },
        },
        tokenizer: {
          autocomplete_tokenizer: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 15,
            token_chars: ['letter', 'digit'],
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'standard',
          fields: {
            suggest: {
              type: 'text',
              analyzer: 'autocomplete',
              search_analyzer: 'autocomplete_search',
            },
          },
        },
        description: { type: 'text', analyzer: 'standard' },
        brand: { type: 'keyword' },
        category: { type: 'keyword' },
        tags: { type: 'keyword' },
        price: { type: 'float' },
        rating: { type: 'float' },
        stock: { type: 'integer' },
        createdAt: { type: 'date' },
      },
    },
  });
  console.log('Elasticsearch index settings/mappings created.');
}

export async function bulkIndexElastic(
  esClient: Client,
  batch: SeedProduct[],
): Promise<void> {
  const operations = batch.flatMap((doc) => [
    { index: { _index: 'products', _id: doc.id } },
    doc,
  ]);

  await esClient.bulk({ refresh: false, operations });
}
