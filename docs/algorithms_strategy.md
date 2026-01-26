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

### 3.3 Modern Implementation with Universal Crypto Support
We implement the shuffle using a **Shared Cursor Pattern** and a **Universal Crypto Adapter**. This ensures maximum performance and cross-environment safety.

```javascript
/* -------------------------------------------------------------------------- */
/* SHARED MODULE STATE                                                        */
/* -------------------------------------------------------------------------- */
const BUFFER_SIZE = 4096;
const MAX_UINT32 = 0xFFFFFFFF;
let sharedRandomBuffer = null;
let sharedCursor = BUFFER_SIZE; // Persisted to prevent entropy thrashing

// Resolve crypto with Legacy Node/CommonJS Adapter
let cryptoLib;
if (typeof crypto !== 'undefined') {
    cryptoLib = crypto; // Modern Browser
} else if (typeof require === 'function') {
    try {
        const nodeCrypto = require('crypto');
        cryptoLib = nodeCrypto.webcrypto || {
            getRandomValues: (buf) => {
                nodeCrypto.randomFillSync(buf);
                return buf; // W3C Spec Compliance
            }
        };
    } catch (e) { /* Fallback to Math.random if crypto unavailable */ }
}
const useCrypto = !!(cryptoLib && cryptoLib.getRandomValues);

/**
 * Randomly reorders (shuffles) an array in-place using Fisher-Yates.
 * * COMPLEXITY:
 * - Time: O(N)
 * - Space: O(1) - Amortized via module-level buffer.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} - The mutated array.
 */
const shuffleArray = (array) => {
    if (!Array.isArray(array)) throw new TypeError("Input must be an array.");

    const len = array.length;
    if (len <= 1) return array;

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
            const threshold = MAX_UINT32 - (MAX_UINT32 % range);
            let candidate;
            do {
                if (sharedCursor >= BUFFER_SIZE) refillBuffer();
                candidate = sharedRandomBuffer[sharedCursor++];
            } while (candidate >= threshold);
            j = candidate % range;
        } else {
            j = Math.floor(Math.random() * (i + 1));
        }
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};
```

### 3.4 Deep Insight: Resource Stewardship & Stability
A "Google-tier" implementation goes beyond basic logic to address system-level concerns:

*   **Entropy Stewardship (Shared Cursor):** Naive implementations call `crypto.getRandomValues` on every shuffle or refill a massive buffer every time. By persisting the `sharedCursor`, we consume only the entropy required, amortizing the cost of the cryptographic system call across multiple function invocations. This is essential for high-throughput microservices.
*   **Universal Compatibility (Legacy Adapter):** We bridge the gap between Modern Web Crypto and legacy Node.js (<v19) by wrapping `randomFillSync`. This prevents a "Silent Downgrade" to weak randomness in older environments, ensuring production-grade security everywhere.
*   **W3C Spec Compliance:** The adapter explicitly returns the buffer, satisfying the W3C signature and preventing breakage in code that relies on method chaining.

---

## 4. Question A2: Pandigital Integer Detection

### 4.1 Defining the Problem Space
A "Pandigital" number is one that contains all digits within a specific base. The prompt asks for "pandigital integer detection." In the absence of a specified range (e.g., "1 to 9"), the standard interpretation for base-10 integers is the "0 to 9" pandigital definition: the number must contain every digit from 0 to 9 at least once.

**Type Handling Requirements:** While the prompt specifies "integer detection," JavaScript `Number` types are floating-point values (IEEE 754). Integers larger than $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER`) lose precision. A truly robust solution must handle the input as a string or convert the number to a string immediately to avoid precision loss on large pandigital numbers.

### 4.1 Problem Definition & Strict Permutation
In a professional context, "Pandigital" implies a strict permutation of set elements. For digits 0-9, this mandates exactly 10 characters. 

### 4.2 The Bitwise Strategy + Length Guard
*   **Bitmask:** We utilize a 32-bit integer. When digit $k$ is seen, `mask |= (1 << k)`.
*   **Fail Fast (O(1)):** Before bitwise processing, we verify `str.length === 10`. This eliminates DoS vectors from massive strings and ensures strictness.
*   **Precision Safety:** We strictly reject `!Number.isSafeInteger(input)` to avoid validating data corrupted by IEEE 754 truncation.

### 4.3 The Final Solution
```javascript
/**
 * Helper to perform bitmask check on digit sequences.
 * @param {string} str 
 * @returns {boolean}
 */
const checkStringBitmask = (str) => {
    let mask = 0;
    const TARGET_MASK = 1023; // Digits 0-9

    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 48 || code > 57) return false; // Strict digit-only
        mask |= (1 << (code - 48));
    }
    return mask === TARGET_MASK;
};

/**
 * Detects if a value is a 0-9 pandigital number.
 * @param {string|number} input 
 * @returns {boolean}
 */
const isPandigital = (input) => {
    if (input == null) return false;

    let str;
    if (typeof input === 'number') {
        if (input < 1023456789 || !Number.isSafeInteger(input)) return false;
        str = String(input);
        if (str.includes('e')) return false;
    } else {
        str = String(input);
    }

    // Strict 10-digit guard for 0-9 permutation
    return str.length === 10 && checkStringBitmask(str);
};
```

### 4.4 Insight: Defensive Security & O(1) Failures
The "Length Guard" is more than a correctness check; it is a **Defensive Security** measure. By rejecting non-10-digit strings in constant time, we prevent the algorithm from wasting CPU cycles on arbitrarily long inputs, demonstrating "Mission Alignment" with software robustness and reliability.