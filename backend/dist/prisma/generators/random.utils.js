"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PseudoRandom = void 0;
class PseudoRandom {
    state;
    constructor(seed = 12345) {
        this.state = seed;
    }
    next() {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    randomInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    randomFloat(min, max, decimals = 1) {
        const val = this.next() * (max - min) + min;
        return Number(val.toFixed(decimals));
    }
    randomItem(array) {
        const index = Math.floor(this.next() * array.length);
        return array[index];
    }
    randomItems(array, count) {
        const copy = [...array];
        const result = [];
        const n = Math.min(count, copy.length);
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(this.next() * copy.length);
            result.push(copy.splice(idx, 1)[0]);
        }
        return result;
    }
    generateUuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.floor(this.next() * 16);
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    randomDate() {
        const start = new Date(2024, 0, 1).getTime();
        const end = new Date(2026, 0, 1).getTime();
        const timestamp = start + this.next() * (end - start);
        return new Date(timestamp);
    }
}
exports.PseudoRandom = PseudoRandom;
//# sourceMappingURL=random.utils.js.map