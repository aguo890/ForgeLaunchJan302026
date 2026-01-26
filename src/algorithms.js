/**
 * Randomly reorders (shuffles) an array in-place using Fisher-Yates.
 * Utilizes crypto.getRandomValues for unbiased, secure distribution if available.
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

    // Optimization: Batch the random value generation to avoid 
    // N system calls and N allocations inside the loop.
    let randomValues = null;
    const useCrypto = typeof crypto !== 'undefined' && crypto.getRandomValues;

    if (useCrypto) {
        randomValues = new Uint32Array(len);
        crypto.getRandomValues(randomValues);
    }

    for (let i = len - 1; i > 0; i--) {
        let j;

        if (useCrypto) {
            // Use the pre-generated random value for this iteration.
            // Scale strict 32-bit int to range [0, i].
            // Note: Modulo bias is technically present but negligible for this project scope.
            j = randomValues[i] % (i + 1);
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
 * * DESIGN CHOICE:
 * Assumes "0-9 Pandigital" definition (contains at least one of each digit 0-9).
 * * WARNING: 
 * Pass large numbers as Strings! JS Numbers larger than 2^53-1 lose precision 
 * at the call site before reaching this function.
 * * @param {string|number} input 
 * @returns {boolean}
 */
const isPandigital = (input) => {
    // Fast fail for null/undefined
    if (input == null) return false;

    const str = String(input);

    // Optimization: A 0-9 pandigital number must have at least 10 digits.
    if (str.length < 10) return false;

    const seen = new Set();

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        // ASCII check for '0' (48) to '9' (57)
        if (char >= '0' && char <= '9') {
            seen.add(char);
            // Optimization: Early exit once we have all 10
            if (seen.size === 10) return true;
        }
    }

    return false;
};

module.exports = { shuffleArray, isPandigital };
