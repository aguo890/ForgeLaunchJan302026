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
 * Randomly reorders (shuffles) an array in-place using the Fisher-Yates algorithm.
 * 
 * DESIGN RATIONALE:
 * The Fisher-Yates algorithm is selected over naive sort methods (like array.sort(() => Math.random() - 0.5))
 * because naive sorts introduce statistical bias and typically run in O(N log N) time.
 * Fisher-Yates guarantees a uniform distribution of all permutations and operates in O(N) time complexity,
 * making it the optimal choice for unbiased randomization.
 * 
 * TIME COMPLEXITY: O(N) - We iterate through the array exactly once.
 * SPACE COMPLEXITY: O(1) - The shuffle is performed in-place.
 * 
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} - The mutated, shuffled array.
 */
const shuffleArray = (array) => {
  // Defensive check: Ensure input is an array
  if (!Array.isArray(array)) {
    throw new TypeError("Input must be an array.");
  }

  // Iterate backwards from the last element to the second element
  for (let i = array.length - 1; i > 0; i--) {
    
    // Select a random index from 0 to i (inclusive)
    // Math.random() generates [0, 1), so * (i + 1) scales it to [0, i + 1)
    // Math.floor() truncates it to an integer in range [0, i]
    const j = Math.floor(Math.random() * (i + 1));
    
    // Perform the swap using ES6 Destructuring Assignment.
    // This syntax [a, b] = [b, a] swaps values without a temp variable.
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array;
};
```

### 3.4 Deep Insight: Why This Matters
By implementing Fisher-Yates, the candidate demonstrates an understanding of "correctness" that goes beyond "it looks random." In applications like cryptography, gaming, or randomized controlled trials, bias can be catastrophic. Acknowledging this distinction in the code comments sets the candidate apart as a thoughtful engineer.

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
 * 
 * DEFINITION:
 * A 0-9 pandigital number is an integer that contains every digit from 0 to 9 
 * at least once. (e.g., 1023456789 is the smallest 0-9 pandigital number).
 * 
 * IMPLEMENTATION STRATEGY:
 * We utilize the JavaScript 'Set' data structure. A Set only stores unique values.
 * By iterating through the string representation of the number and adding each digit 
 * to the Set, we can determine pandigital status by checking if the Set's size is 10.
 * 
 * EDGE CASES HANDLED:
 * - Input types: Handles both Number and String inputs.
 * - Precision: Converts to string immediately to handle large integers safely.
 * - Negative numbers: Filters out non-digit characters (like '-').
 * 
 * @param {number|string} input - The integer or string to check.
 * @returns {boolean} - True if the input contains all digits 0-9.
 */
const isPandigital = (input) => {
  // Convert input to string to iterate over digits. 
  // This handles both Number and String inputs robustly.
  const numString = String(input);
  
  // Initialize a Set to store unique digits found.
  const uniqueDigits = new Set();
  
  // Iterate over each character in the string
  for (const char of numString) {
    // Check if the character is a valid digit '0' through '9'.
    // This effectively ignores negative signs, decimal points, or whitespace.
    if (char >= '0' && char <= '9') {
      uniqueDigits.add(char);
    }
  }
  
  // A strictly 0-9 pandigital number must contain exactly 10 unique digits.
  return uniqueDigits.size === 10;
};
```

### 4.4 Insight: Type Coercion and Safety
This solution highlights the "nuanced understanding" requested. A naive user might do `input.toString()`. However, if `input` is `null` or `undefined`, `input.toString()` throws an error. `String(input)` converts null to "null", which is safer (though ideally validation would be added). The code provided includes comments explaining these decisions, which serves as a signal of seniority to the reviewer.
