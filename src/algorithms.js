/**
 * Randomly reorders (shuffles) an array in-place using Fisher-Yates with Rejection Sampling.
 * Uses crypto.getRandomValues for unbiased, secure distribution if available.
 * * COMPLEXITY:
 * - Time: O(N)
 * - Space: O(1) (In-place)
 * * @param {Array} array - The array to shuffle.
 * @returns {Array} - The mutated array.
 */
const shuffleArray = (array) => {
    if (!Array.isArray(array)) throw new TypeError("Input must be an array.");

    const len = array.length;
    if (len <= 1) return array;

    const useCrypto = typeof crypto !== 'undefined' && crypto.getRandomValues;
    let randomValues = null;
    let cursor = 0;

    // Initialize buffer if using crypto
    if (useCrypto) {
        // Allocate a buffer slightly larger than len to account for rejections.
        // In the extreme rare case we run out, we'll refill.
        const bufferSize = len + Math.ceil(len * 0.1) + 16;
        randomValues = new Uint32Array(bufferSize);
        crypto.getRandomValues(randomValues);
    }

    const MAX_UINT32 = 0xFFFFFFFF;

    for (let i = len - 1; i > 0; i--) {
        let j;

        if (useCrypto) {
            const range = i + 1;
            const threshold = MAX_UINT32 - (MAX_UINT32 % range);

            let candidate;
            do {
                if (cursor >= randomValues.length) {
                    // Refill buffer if exhausted (extremely rare)
                    crypto.getRandomValues(randomValues);
                    cursor = 0;
                }
                candidate = randomValues[cursor++];
            } while (candidate >= threshold);

            j = candidate % range;
        } else {
            // Fallback for older environments
            j = Math.floor(Math.random() * (i + 1));
        }

        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

/**
 * Detects if a value contains all digits 0-9.
 * * OPTIMIZATION:
 * Uses a bitmask (integer) check instead of a Set to minimize heap allocations.
 * Checks against binary 1111111111 (Decimal 1023).
 * * @param {string|number} input 
 * @returns {boolean}
 */
const isPandigital = (input) => {
    // Fast fail for null/undefined
    if (input == null) return false;

    // Check for 'e' ONLY if input was a number (scientific notation data loss)
    // If input is a string, 'e' is just a character and doesn't imply loss of precision for the "digits"
    if (typeof input === 'number') {
        const strVal = String(input);
        if (strVal.includes('e') || strVal.includes('E')) return false;
    }

    const str = String(input);

    // Optimization: A 0-9 pandigital number must have at least 10 digits.
    if (str.length < 10) return false;

    let mask = 0;
    const TARGET_MASK = 1023; // Binary 1111111111

    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        // '0' is 48, '9' is 57
        if (code >= 48 && code <= 57) {
            const digit = code - 48;
            mask |= (1 << digit);

            // Optimization: Early exit
            if (mask === TARGET_MASK) return true;
        }
    }

    return false;
};

module.exports = { shuffleArray, isPandigital };
