"use strict";

/**
 * @file url_shortener.js
 * @description Distributed-ready URL Shortener using Base62 encoding.
 * 
 * Engineering Standards:
 * - Bijective Mapping: Every ID maps to exactly one Base62 string and vice versa
 * - URL-Safe Characters: Uses [0-9a-zA-Z] to avoid encoding issues
 * - Cache-Aside Pattern: Optimized for high-read workloads
 */

/* -------------------------------------------------------------------------- */
/* BASE62 CODEC                                                                */
/* -------------------------------------------------------------------------- */

const CHARSET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const BASE = CHARSET.length; // 62

/**
 * Encodes a unique integer ID into a Base62 string.
 * @param {number} num - The unique ID from the generator (e.g., Snowflake ID).
 * @returns {string} The shortened URL key.
 */
function encodeBase62(num) {
    if (num === 0) return CHARSET[0];

    let res = "";
    while (num > 0) {
        res = CHARSET[num % BASE] + res;
        num = Math.floor(num / BASE);
    }
    return res;
}

/**
 * Decodes a Base62 string back into the original integer ID.
 * @param {string} str - The shortened URL key.
 * @returns {number} The original unique ID.
 */
function decodeBase62(str) {
    let res = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = CHARSET.indexOf(str[i]);
        res = res * BASE + charCode;
    }
    return res;
}

/* -------------------------------------------------------------------------- */
/* SYSTEM FLOW: INTEGRATED LOOKUP                                              */
/* -------------------------------------------------------------------------- */

/**
 * Mock Service to demonstrate the Bloom Filter + Cache + DB flow.
 * 
 * Architecture Notes:
 * - Bloom Filter: Probabilistic check to avoid DB hits for non-existent keys
 * - Cache (Redis): O(1) lookup for hot keys
 * - Database (PostgreSQL): O(log N) fallback for cache misses
 */
class URLService {
    constructor() {
        this.cache = new Map(); // Simulating Redis
        this.db = new Map();    // Simulating PostgreSQL
        // In production, the Bloom Filter would be initialized with all existing IDs
    }

    /**
     * Standard Redirect Flow
     * 1. Check Bloom Filter (Pseudocode step)
     * 2. Check Cache (O(1))
     * 3. Fallback to DB (O(log N))
     * @param {string} shortKey - The Base62 encoded short URL key.
     * @returns {Promise<string|null>} The original long URL or null if not found.
     */
    async getLongUrl(shortKey) {
        // [PERFORMANCE] Step 1: Bloom Filter Check (Probabilistic)
        // if (!bloomFilter.mightContain(shortKey)) return null;

        // Step 2: Cache-Aside Pattern
        if (this.cache.has(shortKey)) {
            console.log(`[CACHE HIT] ${shortKey}`);
            return this.cache.get(shortKey);
        }

        // Step 3: Database Lookup
        const id = decodeBase62(shortKey);
        const longUrl = this.db.get(id);

        if (longUrl) {
            console.log(`[DB HIT] ${shortKey}`);
            this.cache.set(shortKey, longUrl); // Hydrate cache
            return longUrl;
        }

        return null; // 404 Logic
    }

    /**
     * Creates a new short URL mapping.
     * @param {number} id - The unique ID from the distributed ID generator.
     * @param {string} longUrl - The original URL to shorten.
     * @returns {string} The Base62 encoded short key.
     */
    createShortUrl(id, longUrl) {
        const shortKey = encodeBase62(id);
        this.db.set(id, longUrl);
        // [OPTIMIZATION] Optionally pre-warm cache for expected high-traffic URLs
        return shortKey;
    }
}

/* -------------------------------------------------------------------------- */
/* VERIFICATION SUITE (SELF-TESTING)                                          */
/* -------------------------------------------------------------------------- */

if (typeof require !== 'undefined' && require.main === module) {
    (async () => {
        console.log("Running URL Shortener Verification...\n");

        const assert = (condition, msg) => {
            if (!condition) console.error(`[FAIL] ${msg}`);
            else console.log(`[PASS] ${msg}`);
        };

        // 1. Bijective Property Tests
        console.log("--- Bijective Mapping Tests ---");
        const testCases = [0, 1, 61, 62, 123456789, 999999999];

        for (const id of testCases) {
            const encoded = encodeBase62(id);
            const decoded = decodeBase62(encoded);
            assert(decoded === id, `ID ${id} => "${encoded}" => ${decoded}`);
        }

        // 2. Character Range Test
        console.log("\n--- Character Range Tests ---");
        const encoded62 = encodeBase62(62);
        assert(encoded62 === "10", `62 encodes to "10" (got "${encoded62}")`);

        const encodedMax = encodeBase62(3521614606207); // 62^7 - 1
        assert(encodedMax === "ZZZZZZZ", `Max 7-char value encodes correctly`);

        // 3. Service Flow Test
        console.log("\n--- Service Flow Tests ---");
        const service = new URLService();
        const shortKey = service.createShortUrl(123456789, "https://example.com/very/long/url");
        assert(shortKey === encodeBase62(123456789), "Short key matches encoded ID");

        const retrieved = await service.getLongUrl(shortKey);
        assert(retrieved === "https://example.com/very/long/url", "Long URL retrieved from DB");

        const cached = await service.getLongUrl(shortKey);
        assert(cached === "https://example.com/very/long/url", "Long URL retrieved from cache");

        console.log("\nVerification Complete.");
    })();
}

module.exports = { encodeBase62, decodeBase62, URLService };
