import { Client } from '@elastic/elasticsearch';
import { SeedProduct } from '../generators/product.generator';
export declare function setupElasticIndex(esClient: Client): Promise<void>;
export declare function bulkIndexElastic(esClient: Client, batch: SeedProduct[]): Promise<void>;
