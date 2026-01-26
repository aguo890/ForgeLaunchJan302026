/**
 * @fileoverview Security Audit: Encapsulation & Integrity
 */
const { TodoList } = require('../src/system_design');
const assert = require('assert');

console.log('--- Starting Security Audit ---');

function runTest(testName, testFn) {
    try {
        testFn();
        console.log(`\x1b[32m[PASS]\x1b[0m ${testName}`);
    } catch (error) {
        console.error(`\x1b[31m[FAIL]\x1b[0m ${testName}`);
        console.error(error.message);
        process.exit(1);
    }
}

runTest('Security: Internal state should remain immutable via getters', () => {
    const list = new TodoList();
    list.add('Critical Data');

    const tasks = list.getAll();
    const taskDTO = tasks[0];

    // Attempt to mutate the returned object
    try {
        taskDTO.status = 'CORRUPTED';
    } catch (e) {
        // Strict mode might throw, which is good.
        // console.log('Caught expected error during mutation attempt:', e.message);
    }

    // Verify the internal state logic
    // We check via a fresh getAll() call.
    const freshView = list.getAll();

    assert.strictEqual(freshView[0].status, 'pending', 'Internal state was modified by reference!');

    // Double check that the object is actually frozen
    assert.strictEqual(Object.isFrozen(taskDTO), true, 'Returned object is not frozen DTO');
});
