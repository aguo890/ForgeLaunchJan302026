/**
 * @fileoverview Verification Suite for System Design
 * Includes: Unit Tests, Integration Tests, Boundary Tests
 */

const { Task, TodoList, TaskStatus } = require('../src/system_design');
const assert = require('assert');

// Simple Color-Coded Test Runner
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

console.log('--- Starting System Design Verification ---');

// 1. Unit Tests: Task Validation
runTest('Task: Should create a valid task with defaults', () => {
    const task = new Task(1, 'Buy groceries');
    assert.strictEqual(task.status, TaskStatus.PENDING);
    assert.strictEqual(task.description, 'Buy groceries');
});

runTest('Task: Should throw error on empty description', () => {
    assert.throws(() => new Task(1, '   '), /non-empty string/);
});

runTest('Task: Should update status correctly', () => {
    const task = new Task(1, 'Test');
    task.updateStatus(TaskStatus.COMPLETED);
    assert.strictEqual(task.status, TaskStatus.COMPLETED);
});

runTest('Task: Should throw error on invalid status', () => {
    const task = new Task(1, 'Test');
    assert.throws(() => task.updateStatus('INVALID_STATUS'), /Invalid status/);
});

// 2. Integration Tests: TodoList Workflow
runTest('TodoList: Full Workflow (Add -> Edit -> Delete)', () => {
    const list = new TodoList();

    // Add - Returns ID now
    const t1Id = list.add('Item 1 [MOCK]');
    const t2Id = list.add('Item 2 [MOCK]');
    assert.strictEqual(list.getAll().length, 2);

    // Edit
    list.edit(t1Id, 'Item 1 Updated [MOCK]');
    assert.strictEqual(list.getAll()[0].description, 'Item 1 Updated [MOCK]');

    // Delete
    const deleted = list.delete(t2Id);
    assert.strictEqual(deleted, true);
    assert.strictEqual(list.getAll().length, 1);
});

// 3. Boundary Tests: Reorganize
runTest('TodoList: Reorganize items (Boundary Check)', () => {
    const list = new TodoList();
    list.add('A'); // Index 0
    list.add('B'); // Index 1
    list.add('C'); // Index 2

    // Move 'C' (2) to 'A' (0) -> [C, A, B]
    list.reorganize(2, 0);
    const tasks = list.getAll();

    assert.strictEqual(tasks[0].description, 'C');
    assert.strictEqual(tasks[1].description, 'A');
    assert.strictEqual(tasks[2].description, 'B');
});

runTest('TodoList: Reorganize throws on out of bounds', () => {
    const list = new TodoList();
    list.add('A');
    assert.throws(() => list.reorganize(0, 5), /out of bounds/);
    assert.throws(() => list.reorganize(-1, 0), /out of bounds/);
});

console.log('\x1b[32mAll System Design tests passed.\x1b[0m');
