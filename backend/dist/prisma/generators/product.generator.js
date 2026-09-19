"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProducts = generateProducts;
const brand_generator_1 = require("./brand.generator");
const category_generator_1 = require("./category.generator");
const random_utils_1 = require("./random.utils");
const ADJECTIVES = [
    'Pro',
    'Ultra',
    'Max',
    'Lite',
    'Air',
    'Plus',
    'Edge',
    'Studio',
    'Master',
    'Slim',
];
const COLORS = [
    'Space Gray',
    'Midnight Black',
    'Titanium Silver',
    'Alpine White',
    'Navy Blue',
    'Rose Gold',
    'Graphite',
];
const STORAGE_SIZES = ['128GB', '256GB', '512GB', '1TB'];
const REALISTIC_PRODUCT_NAMES = {
    Apple: [
        'iPhone 15 Pro Max',
        'MacBook Pro 16-inch',
        'iPad Air M2',
        'AirPods Pro 2nd Gen',
        'Watch Series 9',
    ],
    Samsung: [
        'Galaxy S24 Ultra',
        'Galaxy Book4 Pro',
        'Galaxy Tab S9',
        'Galaxy Buds2 Pro',
        'Neo QLED 4K TV',
    ],
    Sony: [
        'WH-1000XM5 Headphones',
        'PlayStation 5 Digital Edition',
        'Alpha A7 IV Camera',
        'Bravia XR OLED TV',
    ],
    Logitech: [
        'MX Master 3S Wireless Mouse',
        'MX Keys Mini Keyboard',
        'C920 HD Pro Webcam',
        'G Pro X Headset',
    ],
    Dell: [
        'XPS 13 Laptop',
        'UltraSharp 27 4K Monitor',
        'Alienware m18 Gaming Laptop',
    ],
    Nike: [
        'Air Zoom Pegasus 40',
        'Air Max 270',
        'Dunk Low Sneakers',
        'Tech Fleece Hoodie',
    ],
    Adidas: [
        'Ultraboost Light Shoes',
        'Samba OG Sneakers',
        'Tiro 23 Track Pants',
    ],
    Dyson: [
        'V15 Detect Vacuum',
        'Airwrap Multi-Styler',
        'Purifier Cool Gen1',
    ],
    Bose: [
        'QuietComfort Ultra Headphones',
        'SoundLink Flex Speaker',
        'Smart Ultra Soundbar',
    ],
};
const DESCRIPTION_TEMPLATES = [
    'Experience unmatched performance with the {name}. Built by {brand} with {tag} design and premium materials.',
    'The ultimate {category} essential by {brand}. Designed for {tag} aesthetics, long-lasting durability, and daily comfort.',
    'Upgrade your workflow with the {name}. Features state-of-the-art engineering, {color} finish, and high reliability.',
    'High-performance {category} crafted by {brand}. Designed for maximum comfort during long-term active use.',
];
function generateProducts(count, rng = new random_utils_1.PseudoRandom(42)) {
    const products = [];
    const categoriesList = Object.keys(category_generator_1.CATEGORIES);
    for (let i = 0; i < count; i++) {
        const category = rng.randomItem(categoriesList);
        const productTypes = category_generator_1.CATEGORIES[category];
        const productType = rng.randomItem(productTypes);
        const brand = rng.randomItem(brand_generator_1.BRANDS);
        let name = '';
        const presetNames = REALISTIC_PRODUCT_NAMES[brand];
        if (presetNames && rng.randomFloat(0, 1) > 0.4) {
            name = `${brand} ${rng.randomItem(presetNames)}`;
        }
        else {
            const adjective = rng.randomItem(ADJECTIVES);
            const color = rng.randomItem(COLORS);
            const storage = category === 'Electronics' ? ` ${rng.randomItem(STORAGE_SIZES)}` : '';
            name = `${brand} ${adjective} ${productType}${storage} (${color})`;
        }
        const template = rng.randomItem(DESCRIPTION_TEMPLATES);
        const description = template
            .replace('{name}', name)
            .replace('{brand}', brand)
            .replace('{category}', category.toLowerCase())
            .replace('{tag}', rng.randomItem(category_generator_1.TAGS))
            .replace('{color}', rng.randomItem(COLORS));
        const price = rng.randomFloat(15, 2500, 2);
        const rating = rng.randomFloat(3.5, 5.0, 1);
        const stock = rng.randomInt(10, 500);
        const productTags = rng.randomItems(category_generator_1.TAGS, rng.randomInt(2, 4));
        products.push({
            id: rng.generateUuid(),
            name,
            description,
            brand,
            category,
            tags: productTags,
            price,
            rating,
            stock,
            createdAt: rng.randomDate(),
        });
    }
    return products;
}
//# sourceMappingURL=product.generator.js.map