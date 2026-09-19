import { PseudoRandom } from './random.utils';
export interface SeedProduct {
    id: string;
    name: string;
    description: string;
    brand: string;
    category: string;
    tags: string[];
    price: number;
    rating: number;
    stock: number;
    createdAt: Date;
}
export declare function generateProducts(count: number, rng?: PseudoRandom): SeedProduct[];
