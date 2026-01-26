# Part 1: Software Engineering Project - Group A (Algorithmic Selection)

## 1. Executive Summary
The first section of the technical challenge requires selecting two questions from Group A. The available options are:
1.  Palindrome detection.
2.  Pandigital integer detection.
3.  Randomly reorder an array.
4.  Counting with 'yee'/'haw' (FizzBuzz variant).

## 2. Strategic Question Selection
To "make the best project," the candidate must choose the questions that offer the highest ceiling for demonstrating technical depth.

*   **Palindrome Detection** and **Yee/Haw** are trivial exercises often assigned to first-year students. While solving them correctly is acceptable, they offer little room to showcase advanced knowledge of data structures or probability.
*   **Pandigital Detection** and **Random Array Reordering** involve deeper mathematical concepts (Set theory, permutations, probability distribution) and performance considerations ($O(N)$ complexity).

Therefore, this report advises selecting **Randomly Reorder an Array** and **Pandigital Integer Detection**. These choices signal confidence in handling complex data manipulation and algorithmic theory.

---

## 3. Question A1: Randomly Reorder an Array

### 3.1 The Pitfalls of Naive Shuffling
A common mistake in junior submissions is attempting to shuffle an array using the sort method with a random comparator:

```javascript
// DO NOT USE THIS
array.sort(() => Math.random() - 0.5);
```

While concise, this approach is **fundamentally flawed**. It does not produce a uniform distribution of permutations. The probability of an element ending up in a specific position is not $1/N$, leading to statistical bias. Additionally, the time complexity of sort is typically $O(N \log N)$. A professional engineer knows that shuffling can be achieved in $O(N)$.

### 3.2 The Fisher-Yates (Knuth) Shuffle Algorithm
The industry-standard solution is the Fisher-Yates shuffle. This algorithm iterates through the array from the last element to the first, swapping the current element with a randomly selected element from the pool of "unshuffled" elements (indices 0 to current).

**Algorithm Mechanics:**
1.  Initialize a loop from the last index `i` down to 1.
2.  Generate a random integer `j` such that $0 \le j \le i$.
3.  Swap the element at index `i` with the element at index `j`.
4.  Decrement `i` and repeat.

This ensures that every element has an equal probability of being placed in any remaining slot, resulting in a perfectly unbiased permutation.

### 3.3 Modern Implementation with ES6 Destructuring
We can leverage ES6 Destructuring Assignment to perform the swap operation in a single line, eliminating the need for a temporary variable. This demonstrates familiarity with modern syntax features.

```javascript
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

    /**
     * Fills a Uint32Array with random values in chunks to stay within 
     * the Web Crypto API's 65,536-byte limit per call.
     * @param {Uint32Array} buffer - The buffer to fill.
     */
    const safeRandomFill = (buffer) => {
        const MAX_BYTES = 65536;
        const BYTES_PER_ELEMENT = 4; // Uint32Array
        const CHUNK_SIZE = MAX_BYTES / BYTES_PER_ELEMENT; // 16384

        for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
            const end = Math.min(i + CHUNK_SIZE, buffer.length);
            const view = buffer.subarray(i, end);
            crypto.getRandomValues(view);
        }
    };

    // Initialize buffer if using crypto
    if (useCrypto) {
        // Allocate a buffer slightly larger than len to account for rejections.
        const bufferSize = len + Math.ceil(len * 0.1) + 16;
        randomValues = new Uint32Array(bufferSize);
        safeRandomFill(randomValues);
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
                    // Refill buffer in chunks if exhausted
                    safeRandomFill(randomValues);
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
```

### 3.4 Deep Insight: Performance & Security Balance
By implementing Fisher-Yates, we ensure mathematical correctness. However, a naive implementation of `crypto.getRandomValues` inside a loop would be a performance disaster due to system call overhead. This solution demonstrates "Staff-level" awareness by **batching entropy generation**: we allocate a `Uint32Array` and fetch required random bits in bulk.

**Quota Management:** To ensure reliability across environments (like Chrome or Node.js) that impose a 65,536-byte limit on `getRandomValues`, we implement **Chunked Filling**. The buffer is filled in safe batches of 16,384 elements, preventing `QuotaExceededError` on large arrays while maintaining the efficiency of batched system calls.

**Statistical Integrity:** The implementation eliminates modulo bias entirely by implementing **Rejection Sampling**. For each index `i`, it defines a `threshold` and discards any random candidate that falls in the non-uniform top segment of the 32-bit range, guaranteeing perfect uniformity in the final distribution. This demonstrates a rigorous, cryptographic-strength approach to random number generation.

---

## 4. Question A2: Pandigital Integer Detection

### 4.1 Defining the Problem Space
A "Pandigital" number is one that contains all digits within a specific base. The prompt asks for "pandigital integer detection." In the absence of a specified range (e.g., "1 to 9"), the standard interpretation for base-10 integers is the "0 to 9" pandigital definition: the number must contain every digit from 0 to 9 at least once.

**Type Handling Requirements:** While the prompt specifies "integer detection," JavaScript `Number` types are floating-point values (IEEE 754). Integers larger than $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER`) lose precision. A truly robust solution must handle the input as a string or convert the number to a string immediately to avoid precision loss on large pandigital numbers.

### 4.2 The Bitwise Optimization Strategy
While a naive solution might use a `Set` to track unique digits (requiring heap allocation and hashing overhead), a "Staff-Level" approach utilizes **Bitmasks**.

*   **Logic:** We utilize a single 32-bit integer as a map. Each bit position corresponds to a digit (0 through 9).
*   **Mechanism:** When digit $k$ is encountered, we apply a bitwise OR: `mask |= (1 << k)`.
*   **Verification:** A complete 0-9 pandigital number will result in a bitmask of `1111111111` (Decimal `1023`).
*   **Efficiency:** 
    *   **Space:** $O(1)$ (Strictly 4 bytes on the stack, regardless of input size).
    *   **Time:** $O(N)$ with significantly lower constant factors than Hash Set insertions.

### 4.3 The Solution Code
```javascript
/**
 * Detects if a value is a 0-9 pandigital number using a Bitmask Strategy.
 * * ALGORITHMIC STRATEGY:
 * Utilizes a 32-bit integer as a bitmask to track seen digits. This achieves
 * O(1) Space complexity and extremely low constant factors in time.
 * * PRECISION HANDLING:
 * Large integers are converted to strings to avoid IEEE 754 precision loss
 * (which occurs beyond 2^53 - 1).
 * * COMPLEXITY:
 * - Time: O(N) where N is the number of digits.
 * - Space: O(1) - Constant space usage (single 32-bit integer).
 * * @param {string|number} input - The value to check.
 * @returns {boolean}
 */
const isPandigital = (input) => {
    if (input == null) return false;

    // Fast path: If it's a number, ensure it's not scientific notation 
    // which distorts the "digits" concept (e.g., 1e21).
    if (typeof input === 'number') {
        // Optimization: Small numbers cannot be pandigital (must be > 1 billion)
        if (input < 1023456789) return false;

        // Convert to string to handle the digits safely
        const strVal = String(input);
        if (strVal.includes('e')) return false;

        // Pass to the logic below
        return checkStringBitmask(strVal);
    }

    const str = String(input);
    if (str.length < 10) return false;

    return checkStringBitmask(str);
};

/**
 * Helper function to perform the bitmask check on a string.
 * Checks against binary 1111111111 (Decimal 1023).
 * @param {string} str 
 * @returns {boolean}
 */
const checkStringBitmask = (str) => {
    let mask = 0;
    const TARGET_MASK = 0b1111111111; // Binary literal for clarity (ES6)

    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);

        // ASCII '0' is 48, '9' is 57
        if (code >= 48 && code <= 57) {
            const digit = code - 48;
            mask |= (1 << digit); // Set the bit corresponding to the digit

            // Optimization: Early exit if we have found all 10 digits
            if (mask === TARGET_MASK) return true;
        }
    }
    return false;
};
```

### 4.4 Insight: Type Coercion and Safety
This solution highlights "nuanced understanding" in several ways. First, it explicitly handles `null`/`undefined` to prevent runtime errors. Second, it implements a **fast-path optimization** for numbers: any number less than 1,023,456,789 is immediately rejected, as it cannot contain all ten digits. This demonstrates performance-conscious design.

The logic for handling scientific notation has been refined. The function now correctly distinguishes between a *number* in scientific notation (e.g., `1e23`), which loses digit information and returns `false`, and a *string* that merely contains the characters `'1e23...'`, which is processed character-by-character and can return `true` if all digits 0-9 are present. This shows precise attention to JavaScript's type coercion behavior and the semantics of the problem.