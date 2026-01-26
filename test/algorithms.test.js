const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { shuffleArray, isPandigital } = require('../src/algorithms.js');

describe('shuffleArray', () => {
    it('should throw TypeError if input is not an array', () => {
        assert.throws(() => shuffleArray(null), TypeError);
        assert.throws(() => shuffleArray('not an array'), TypeError);
    });

    it('should return the same array instance', () => {
        const arr = [1, 2, 3];
        const result = shuffleArray(arr);
        assert.strictEqual(result, arr);
    });

    it('should preserve all elements', () => {
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];
        shuffleArray(copy);

        assert.strictEqual(copy.length, original.length);
        original.forEach(item => {
            assert.ok(copy.includes(item));
        });
        // Check counts to ensure no duplication/loss
        const sumOriginal = original.reduce((a, b) => a + b, 0);
        const sumCopy = copy.reduce((a, b) => a + b, 0);
        assert.strictEqual(sumCopy, sumOriginal);
    });

    it('should handle empty and single-element arrays', () => {
        const empty = [];
        shuffleArray(empty);
        assert.deepStrictEqual(empty, []);

        const single = [1];
        shuffleArray(single);
        assert.deepStrictEqual(single, [1]);
    });
});

describe('isPandigital', () => {
    it('should return false for null or undefined', () => {
        assert.strictEqual(isPandigital(null), false);
        assert.strictEqual(isPandigital(undefined), false);
    });

    it('should return false for inputs with length < 10', () => {
        assert.strictEqual(isPandigital('123456789'), false); // length 9
        assert.strictEqual(isPandigital(123), false);
    });

    it('should return true for valid 0-9 pandigital numbers (string)', () => {
        assert.strictEqual(isPandigital('0123456789'), true);
        assert.strictEqual(isPandigital('9876543210'), true);
        assert.strictEqual(isPandigital('10234567891023456789'), true); // Repeats allowed
    });

    it('should return true for valid 0-9 pandigital numbers (number)', () => {
        // Note: Leading 0 is octal in some modes or just ignored in math, 
        // but 1023456789 is a valid number.
        assert.strictEqual(isPandigital(1023456789), true);
    });

    it('should return true for pandigital with extra non-digits', () => {
        assert.strictEqual(isPandigital('abc0123456789xyz'), true);
    });

    it('should return false if a digit is missing', () => {
        assert.strictEqual(isPandigital('123456789'), false); // Missing 0
        assert.strictEqual(isPandigital('012345678'), false); // Missing 9
    });

    it('should correctly handle large "integers" passed as strings', () => {
        // 10234567890123456789 is fine as string
        assert.strictEqual(isPandigital('10234567890123456789'), true);
    });
});
