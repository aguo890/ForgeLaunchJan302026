const { isPandigital } = require('../src/algorithms');
const { performance } = require('perf_hooks'); // Built-in node module

console.log("Starting Benchmark: isPandigital (Bitmask vs Set Baseline estimate)");
console.log("---------------------------------------------------------------");

// 0. Warmup (Crucial for JIT accuracy)
console.log("Warming up JIT compiler...");
for (let i = 0; i < 10000; i++) {
    isPandigital("1234567890");
}


// 1. Define the Old Implementation for Comparison
const isPandigitalSet = (input) => {
    if (input == null) return false;
    const str = String(input);
    if (str.length < 10) return false;
    const seen = new Set();
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char >= '0' && char <= '9') {
            seen.add(char);
            if (seen.size === 10) return true;
        }
    }
    return false;
};

// 2. Generate Test Data
const ITERATIONS = 1_000_000;
const testNumbers = [];
console.log(`Generating ${ITERATIONS} test cases...`);

for (let i = 0; i < ITERATIONS; i++) {
    // Generate random strings of length 10-15
    // mix of pandigital and non-pandigital
    const len = 10 + Math.floor(Math.random() * 5);
    let str = "";
    for (let j = 0; j < len; j++) {
        str += Math.floor(Math.random() * 10).toString();
    }
    // Occasionally inject a guaranteed pandigital
    if (i % 10 === 0) {
        testNumbers.push("0123456789" + str.substring(0, 5));
    } else {
        testNumbers.push(str);
    }
}

// 3. Measure Old Implementation (Set)
const startSet = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    isPandigitalSet(testNumbers[i]);
}
const endSet = performance.now();
const timeSet = endSet - startSet;

// 4. Measure New Implementation (Bitmask)
const startBit = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    isPandigital(testNumbers[i]);
}
const endBit = performance.now();
const timeBit = endBit - startBit;

// 5. Report Results
console.log("\nResults:");
console.log(`Set Implementation:     ${timeSet.toFixed(2)} ms`);
console.log(`Bitmask Implementation: ${timeBit.toFixed(2)} ms`);
console.log("---------------------------------------------------------------");

const improvement = timeSet / timeBit;
console.log(`Speedup Factor:         ${improvement.toFixed(2)}x`);

if (timeBit < timeSet) {
    console.log("SUCCESS: Bitmask optimization is faster.");
} else {
    console.error("FAILURE: Bitmask optimization is NOT faster.");
    process.exit(1);
}
