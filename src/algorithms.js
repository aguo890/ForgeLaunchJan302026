"use strict";

/**
 * @file algorithms.js
 * @description Core algorithmic implementations for Group A challenges.
 *
 * Includes:
 * 1. Fisher-Yates Shuffle with cryptographic entropy and rejection sampling.
 * 2. Pandigital detection using integer bitmasking for O(1) space complexity.
 */

/* -------------------------------------------------------------------------- */
/* HELPER FUNCTIONS                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Validates if a string contains ONLY digits and satisfies the 0-9 Pandigital condition.
 *
 * @param {string} str - The string to validate.
 * @returns {boolean} True if the string is a valid 0-9 pandigital representation.
 */
const checkStringBitmask = (str) => {
    let mask = 0;
    const TARGET_MASK = 0b1111111111; // [OPTIMIZATION] Binary literal for 1023 (Digits 0-9)

    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);

        // [SAFETY] Fail if any character is NOT a digit (0-9)
        // Prevents false positives like "1234567890.5"
        if (code < 48 || code > 57) return false;

        const digit = code - 48;
        mask |= (1 << digit); // Set the bit corresponding to the digit
    }
    return mask === TARGET_MASK;
};

/* -------------------------------------------------------------------------- */
/* CORE IMPLEMENTATION                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Randomly reorders (shuffles) an array in-place using Fisher-Yates with Rejection Sampling.
 *
 * IMPLEMENTATION NOTE:
 * Uses an IIFE (Immediately Invoked Function Expression) to encapsulate
 * the entropy buffer, preventing module-scope pollution while maintaining
 * the performance benefits of a static singleton buffer.
 *
 * COMPLEXITY:
 * - Time: O(N)
 * - Space: O(1) - Uses a pre-allocated static entropy buffer and shared cursor.
 *
 * @template T
 * @param {Array<T>} array - The array to shuffle.
 * @returns {Array<T>} - The mutated array.
 */
const shuffleArray = (() => {
    // --- PRIVATE STATIC STATE ---
    // These variables are inaccessible from the outside world
    const BUFFER_SIZE = 4096;
    const MAX_UINT32 = 0xFFFFFFFF;
    let sharedRandomBuffer = null;
    let sharedCursor = BUFFER_SIZE; // Initialize at end to force refill on first use

    // [MODERNITY] Resolve crypto once, at definition time via globalThis (W3C Standard)
    const cryptoLib = globalThis.crypto || (typeof require === 'function' ? require('crypto').webcrypto : undefined);
    const useCrypto = !!(cryptoLib && cryptoLib.getRandomValues);

    // Expose a reset function for deterministic testing
    const shuffleFn = (array) => {
        if (!Array.isArray(array)) throw new TypeError("Input must be an array.");
        const len = array.length;
        if (len <= 1) return array;

        // Lazy-init buffer inside the closure
        if (useCrypto && !sharedRandomBuffer) {
            sharedRandomBuffer = new Uint32Array(BUFFER_SIZE);
        }

        const refillBuffer = () => {
            cryptoLib.getRandomValues(sharedRandomBuffer);
            sharedCursor = 0;
        };

        for (let i = len - 1; i > 0; i--) {
            let j;
            if (useCrypto) {
                const range = i + 1;
                // [STABILITY] Rejection sampling threshold to remove modulo bias
                const threshold = MAX_UINT32 - (MAX_UINT32 % range);
                let candidate;
                do {
                    if (sharedCursor >= BUFFER_SIZE) refillBuffer();
                    candidate = sharedRandomBuffer[sharedCursor++];
                } while (candidate >= threshold);
                j = candidate % range;
            } else {
                // Fallback for non-crypto environments
                j = Math.floor(Math.random() * (i + 1));
            }
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Attach reset method for testing purposes
    shuffleFn._resetEntropy = () => {
        sharedCursor = BUFFER_SIZE;
        sharedRandomBuffer = null;
    };

    return shuffleFn;
})();

/**
 * Detects if a value is a 0-9 pandigital number using a Bitmask Strategy.
 *
 * SAFETY NOTE:
 * Strictly rejects unsafe integers (IEEE 754 precision loss) and non-digit strings
 * to ensure that exactly the digits 0-9 are present with no other characters.
 *
 * @param {string|number} input - The value to check.
 * @returns {boolean} True if input contains exactly the digits 0-9 once each.
 */
const isPandigital = (input) => {
    if (input == null) return false;

    let str;

    // Fast path: Number checks
    if (typeof input === 'number') {
        // [OPTIMIZATION] Small numbers cannot be pandigital
        if (input < 1023456789) return false;
        // [SAFETY] Guard against IEEE 754 precision loss
        if (!Number.isSafeInteger(input)) return false;

        str = String(input);
        if (str.includes('e')) return false;
    } else {
        str = String(input);
    }

    // [STRICTNESS] A 0-9 pandigital number must be exactly 10 digits.
    // Provides O(1) rejection for long strings and ensures strict permutation.
    if (str.length !== 10) return false;

    return checkStringBitmask(str);
};

/* -------------------------------------------------------------------------- */
/* VERIFICATION SUITE (SELF-TESTING)                                          */
/* -------------------------------------------------------------------------- */

// Only run verification if executed directly (not imported)
if (typeof require !== 'undefined' && require.main === module) {
    console.log("Running Integrity Checks...\n");

    const assert = (condition, msg) => {
        if (!condition) console.error(`[FAIL] ${msg}`);
        else console.log(`[PASS] ${msg}`);
    };

    // 1. Pandigital Checks
    console.log("--- Pandigital Tests ---");
    assert(isPandigital(1023456789) === true, "Smallest valid pandigital number (1023456789)");
    assert(isPandigital("0123456789") === true, "String with leading zero");
    assert(isPandigital(123456789) === false, "Missing digit 0 (length 9)");
    assert(isPandigital(1123456789) === false, "Duplicate digit 1");
    assert(isPandigital(12345.6789) === false, "Floating point rejected");
    assert(isPandigital(null) === false, "Null input rejected");
    assert(isPandigital(undefined) === false, "Undefined input rejected");
    assert(isPandigital("123456789a") === false, "Non-digit character rejected");

    // 2. Shuffle Checks
    console.log("\n--- Shuffle Tests ---");
    const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const originalSum = input.reduce((a, b) => a + b, 0);
    const originalLength = input.length;

    // Perform Shuffle
    shuffleArray(input);

    const newSum = input.reduce((a, b) => a + b, 0);
    assert(input.length === originalLength, "Shuffle preserves length");
    assert(newSum === originalSum, "Shuffle preserves elements (checksum)");
    assert(input.some((val, i) => val !== i), "Array was effectively shuffled");

    // Edge cases
    const emptyArr = [];
    shuffleArray(emptyArr);
    assert(emptyArr.length === 0, "Empty array returns empty");

    const singleArr = [42];
    shuffleArray(singleArr);
    assert(singleArr[0] === 42, "Single-element array unchanged");

    // Type safety
    let caught = false;
    try { shuffleArray("not an array"); } catch (e) { caught = true; }
    assert(caught, "TypeError thrown for non-array input");

    console.log("\nVerification Complete.");
}

module.exports = { shuffleArray, isPandigital, _resetEntropy: shuffleArray._resetEntropy };
