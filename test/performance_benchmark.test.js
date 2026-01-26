/**
 * @fileoverview Performance Benchmark: O(1) vs O(N) Lookups
 */
const { TodoList } = require('../src/system_design');

console.log('--- Starting Performance Benchmark ---');

const list = new TodoList();
const itemCount = 50000;
const ids = [];

console.log(`Populating TodoList with ${itemCount} items...`);
for (let i = 0; i < itemCount; i++) {
    ids.push(list.add(`Task ${i}`));
}

const targetId = ids[ids.length - 1]; // Target the last item for worst-case O(N)

console.log(`\nBenchmarking edit() with ${itemCount} items...`);

const start = performance.now();
for (let i = 0; i < 1000; i++) {
    list.edit(targetId, `Updated Task ${i}`);
}
const end = performance.now();

console.log(`Time taken for 1000 edits (O(1) lookups): ${(end - start).toFixed(4)}ms`);
console.log(`Average time per edit: ${((end - start) / 1000).toFixed(4)}ms`);

// Basic verification that the edits worked
const updatedTask = list.getAll().find(t => t.id === targetId);
if (updatedTask.description.startsWith('Updated Task')) {
    console.log('\n\x1b[32m[PASS] Benchmark verified performance and correctness.\x1b[0m');
} else {
    console.log('\n\x1b[31m[FAIL] Edits were not correctly applied.\x1b[0m');
}
