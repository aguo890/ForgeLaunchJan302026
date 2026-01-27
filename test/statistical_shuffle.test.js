const { test, describe } = require('node:test');
const assert = require('node:assert');
const { shuffleArray } = require('../src/algorithms');

/**
 * Statistical Test Suite for shuffleArray
 * 
 * Verifies that the Fisher-Yates implementation with Cryptographic Rejection Sampling
 * produces a statistically uniform distribution across all possible permutations.
 */
describe('shuffleArray Statistical Uniformity', () => {

    test('Distribution approach: Frequency of elements in positions', () => {
        const size = 3;
        const iterations = 60000;
        const expectedFrequency = iterations / size;
        const marginOfError = 0.05; // 5% tolerance

        // Track how many times each number (0, 1, 2) appears at each index (0, 1, 2)
        const counts = Array.from({ length: size }, () => new Array(size).fill(0));

        for (let i = 0; i < iterations; i++) {
            const arr = [0, 1, 2];
            shuffleArray(arr);
            arr.forEach((val, index) => {
                counts[index][val]++;
            });
        }

        // Verify each position has a roughly equal distribution of each value
        counts.forEach((row, rowIndex) => {
            row.forEach((count, colIndex) => {
                const deviation = Math.abs(count - expectedFrequency) / expectedFrequency;
                assert.ok(deviation < marginOfError, `Frequency deviation too high at [${rowIndex}][${colIndex}]: ${deviation}`);
            });
        });
    });

    /**
     * Pearson's Chi-squared test for uniformity
     * This is a more rigorous mathematical verification.
     */
    test('Pearson\'s Chi-squared test for permutation distribution', () => {
        const arr = [0, 1, 2];
        const permutations = [
            '0,1,2', '0,2,1', '1,0,2', '1,2,0', '2,0,1', '2,1,0'
        ];
        const k = permutations.length; // Number of categories
        const iterations = 60000;
        const expected = iterations / k;

        const observed = {};
        permutations.forEach(p => observed[p] = 0);

        for (let i = 0; i < iterations; i++) {
            const target = [...arr];
            shuffleArray(target);
            observed[target.join(',')]++;
        }

        // Calculate Chi-squared statistic: Σ((O - E)^2 / E)
        let chiSquared = 0;
        Object.values(observed).forEach(o => {
            chiSquared += Math.pow(o - expected, 2) / expected;
        });

        // For degrees of freedom (df) = k - 1 = 5
        // A chi-squared value < 11.07 corresponds to p > 0.05
        // This fails to reject the null hypothesis (that the distribution is uniform)
        assert.ok(chiSquared < 11.07, `Chi-squared value too high: ${chiSquared}`);
    });
});
