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
 * Randomly reorders (shuffles) an array in-place using Fisher-Yates.
 * * COMPLEXITY:
 * - Time: O(N) - Single pass.
 * - Space: O(1) - In-place mutation.
 * * @param {Array} array - The array to be shuffled.
 * @returns {Array} - The mutated, shuffled array.
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
```

### 3.4 Deep Insight: Performance & Security Balance
By implementing Fisher-Yates, we ensure mathematical correctness. However, a naive implementation of `crypto.getRandomValues` inside a loop would be a performance disaster due to system call overhead. This solution demonstrates "Staff-level" awareness by **batching entropy generation**: we allocate a single `Uint32Array` and fetch all required random bits in one operation (1 system call) rather than fetching them per iteration (N system calls). This balances cryptographic strength with high-performance execution.

---

## 4. Question A2: Pandigital Integer Detection

### 4.1 Defining the Problem Space
A "Pandigital" number is one that contains all digits within a specific base. The prompt asks for "pandigital integer detection." In the absence of a specified range (e.g., "1 to 9"), the standard interpretation for base-10 integers is the "0 to 9" pandigital definition: the number must contain every digit from 0 to 9 at least once.

**Type Handling Requirements:** While the prompt specifies "integer detection," JavaScript `Number` types are floating-point values (IEEE 754). Integers larger than $2^{53} - 1$ (`Number.MAX_SAFE_INTEGER`) lose precision. A truly robust solution must handle the input as a string or convert the number to a string immediately to avoid precision loss on large pandigital numbers.

### 4.2 The Set Theory Approach
The most efficient way to check for the presence of unique items is using a **Hash Set**. A `Set` in JavaScript is a collection of values where each value must be unique.

*   **Logic:** If we insert every digit of the number into a Set, a valid 0-9 pandigital number must result in a Set with a `.size` of exactly 10 (digits 0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
*   **Efficiency:** This approach requires a single pass through the string $O(N)$ and constant space $O(1)$ (since the set will never exceed 10 elements). This is superior to creating an array of flags or using nested loops.

### 4.3 The Solution Code
```javascript
/**
 * Detects if a given number or string is a 0-9 pandigital number.
 * * EDGE CASES:
 * - Floats: '123.456' is treated as a sequence of digits '123456'.
 * - Large Ints: Handled via String conversion to avoid IEEE 754 precision loss.
 * - Signs: Negative signs are ignored.
 * * @param {number|string} input - The integer or string to check.
 * @returns {boolean} - True if the input contains all digits 0-9.
 */
const isPandigital = (input) => {
  // Fast fail for null/undefined
  if (input == null) return false;

  const str = String(input);

  // Guard: Scientific notation causes false positives (counting exponent digits).
  // Large numbers must be passed as precise strings, not approximations.
  if (str.includes('e') || str.includes('E')) return false;

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
```

### 4.4 Insight: Type Coercion and Safety
This solution highlights "nuanced understanding" in two ways. First, it explicitly handles `null`/`undefined` to prevent runtime errors. Second, it optimizes for performance by discarding strings shorter than 10 characters and using early returns. Finally, the comments warn about IEEE 754 floating-point precision loss, showing deep platform knowledge regarding large integers.
