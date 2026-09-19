export declare class PseudoRandom {
    private state;
    constructor(seed?: number);
    next(): number;
    randomInt(min: number, max: number): number;
    randomFloat(min: number, max: number, decimals?: number): number;
    randomItem<T>(array: T[]): T;
    randomItems<T>(array: T[], count: number): T[];
    generateUuid(): string;
    randomDate(): Date;
}
