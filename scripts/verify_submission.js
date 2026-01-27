/**
 * verify_submission.js
 * PURPOSE:
 * This script serves as a localized Continuous Integration (CI) test suite.
 * It strictly validates the algorithms and system design code intended for the 
 * Forge Launch submission.
 * 
 * OUTPUTS:
 * - Console logs for human readability
 * - docs/test_summary.json for structured artifact consumption
 * 
 * TO RUN:
 * node verify_submission.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

const logPass = (msg) => console.log(`${colors.green}✔ PASS:${colors.reset} ${msg}`);
const logFail = (msg) => console.error(`${colors.red}✘ FAIL:${colors.reset} ${msg}`);
const logHeader = (msg) => console.log(`\n${colors.blue}=== ${msg} ===${colors.reset}`);

// ==========================================
// TEST ARTIFACT: Structured result accumulator
// ==========================================
const testArtifact = {
    timestamp: new Date().toISOString(),
    overall_status: "PASS",
    tests: {},
    meta: {
        engine: `Node ${process.version}`,
        execution_start: Date.now()
    }
};

// Helper to record test results
function recordTest(category, testName, passed, meta = {}) {
    if (!testArtifact.tests[category]) {
        testArtifact.tests[category] = { status: "PASS", checks: [] };
    }

    testArtifact.tests[category].checks.push({
        name: testName,
        status: passed ? "PASS" : "FAIL",
        ...meta
    });

    if (!passed) {
        testArtifact.tests[category].status = "FAIL";
        testArtifact.overall_status = "FAIL";
    }
}

// ==========================================
// SECTION 1: CODE IMPLEMENTATIONS
// (Copy-pasted EXACTLY from Strategy Docs)
// ==========================================

// --- A1: Fisher-Yates Shuffle ---
const shuffleArray = (array) => {
    // Defensive Programming: Validate input type
    if (!Array.isArray(array)) {
        throw new TypeError("Input must be an array.");
    }

    // Iterate backwards to perform swaps
    for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index j such that 0 <= j <= i
        const j = Math.floor(Math.random() * (i + 1));

        // ES6 Destructuring Swap: Clean, modern syntax
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
};

// --- A2: Pandigital Detection ---
const isPandigital = (input) => {
    if (input == null) return false;
    let str;

    if (typeof input === 'number') {
        if (input < 1023456789) return false;
        if (!Number.isSafeInteger(input)) return false;
        str = String(input);
        if (str.includes('e')) return false;
    } else {
        str = String(input);
    }

    if (str.length < 10) return false;

    let mask = 0;
    const TARGET_MASK = 0b1111111111;

    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 48 || code > 57) return false;
        const digit = code - 48;
        mask |= (1 << digit);
    }

    return mask === TARGET_MASK;
};

// --- B1: TodoList Architecture ---
// Helper: Generates a mock UUID (pseudo-random string)
// In production, we would use crypto.randomUUID()
const generateId = () =>
    '_' + Math.random().toString(36).substr(2, 9);

const TaskStatus = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done'
};

class Task {
    constructor(title, description, dueDate) {
        // [REFINE] Collision-resistant UUIDs
        this.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : '_' + Math.random().toString(36).substr(2, 9);

        this.title = title.trim();
        this.description = description.trim();
        this.dueDate = new Date(dueDate);
        this.status = TaskStatus.TODO;
        this.createdAt = new Date();
    }

    update(updates) {
        // [REFINE] Object property safety
        if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
            this.title = updates.title.trim();
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
            this.description = updates.description.trim();
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'dueDate')) {
            this.dueDate = new Date(updates.dueDate);
        }

        // Strict validation for Status transitions
        if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
            const status = updates.status;
            if (Object.values(TaskStatus).includes(status)) {
                this.status = status;
            } else {
                console.warn(`[System] Invalid status attempt: '${status}'`);
            }
        }
    }
}

class TodoList {
    constructor() {
        this.tasks = [];
    }

    add(title, description, dueDate) {
        const newTask = new Task(title, description, dueDate);
        this.tasks.push(newTask);
        return newTask;
    }

    delete(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        return this.tasks.length < initialLength; // Returns true if deleted
    }

    edit(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return null;
        task.update(updates);
        return task;
    }

    /**
     * Reorganizes the list by moving a task from one index to another.
     * Time Complexity: O(N) due to splice.
     */
    reorganize(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.tasks.length ||
            toIndex < 0 || toIndex >= this.tasks.length) {
            console.error("[System] Reorganize failed: Index out of bounds.");
            return false;
        }
        const [movedTask] = this.tasks.splice(fromIndex, 1);
        this.tasks.splice(toIndex, 0, movedTask);
        return true;
    }
}

// ==========================================
// SECTION 2: VERIFICATION SUITE
// ==========================================

function verifyShuffle() {
    logHeader("Testing A1: Fisher-Yates Shuffle");

    const iterations = 60000;
    const tolerance_percent = 2;
    const counts = {};

    // We shuffle [1, 2, 3]. There are 3! = 6 permutations.
    // Expected frequency for each is ~1/6 (approx 16.6%)
    console.log(`Running ${iterations} iterations on [1, 2, 3]...`);

    for (let k = 0; k < iterations; k++) {
        const arr = [1, 2, 3];
        shuffleArray(arr);
        const key = arr.join('');
        counts[key] = (counts[key] || 0) + 1;
    }

    const expected = iterations / 6;
    const tolerance = iterations * (tolerance_percent / 100);

    let passed = true;
    for (const [perm, count] of Object.entries(counts)) {
        const diff = Math.abs(count - expected);
        if (diff > tolerance) {
            logFail(`Permutation ${perm} count ${count} outside tolerance (Exp: ${expected})`);
            passed = false;
        }
    }

    if (passed) logPass("Distribution is statistically uniform (Unbiased).");

    // Record to artifact
    recordTest("fisher_yates", "Statistical Distribution", passed, {
        iterations: iterations,
        tolerance_percent: tolerance_percent,
        permutation_counts: counts,
        comment: passed ? "Statistically uniform" : "Distribution biased"
    });

    // Add summary metadata
    testArtifact.tests.fisher_yates.iterations = iterations;
    testArtifact.tests.fisher_yates.tolerance_percent = tolerance_percent;
}

function verifyPandigital() {
    logHeader("Testing A2: Pandigital Detection");

    const cases = [
        { val: "1023456789", expect: true, name: "Standard 0-9 String" },
        { val: 1023456789, expect: true, name: "Standard 0-9 Number" },
        { val: "11223344556677889900", expect: true, name: "Long w/ Duplicates" },
        { val: "123456789", expect: false, name: "Missing Zero" },
        { val: "ABCDEFGHIJ", expect: false, name: "Non-Digits" },
        { val: 123, expect: false, name: "Short Number" }
    ];

    cases.forEach(c => {
        const result = isPandigital(c.val);
        const passed = (result === c.expect);

        if (passed) {
            logPass(`Case [${c.name}]: Got ${result}`);
        } else {
            logFail(`Case [${c.name}]: Expected ${c.expect}, Got ${result}`);
        }

        // Record to artifact
        recordTest("pandigital", c.name, passed, {
            input: String(c.val),
            expected: c.expect,
            actual: result
        });
    });

    // Add summary metadata
    testArtifact.tests.pandigital.total_cases = cases.length;
}

function verifyTodoList() {
    logHeader("Testing B1: TodoList Architecture");

    const list = new TodoList();
    const checksPerformed = [];

    // 1. ADD & SANITIZATION
    const t1 = list.add(" Task 1 ", "Desc ", "2026-01-01"); // Note spaces
    const t2 = list.add("Task 2", "Desc", "2026-01-02");
    const t3 = list.add("Task 3", "Desc", "2026-01-03");

    let passed = (list.tasks.length === 3);
    if (passed) logPass("Add: Count is 3");
    else logFail(`Add: Count is ${list.tasks.length}`);
    recordTest("todo_list", "Add", passed, { task_count: list.tasks.length });
    checksPerformed.push("Add");

    // Check Sanitization (Trim)
    passed = (t1.title === "Task 1");
    if (passed) logPass("Input Sanitization: Title trimmed");
    else logFail(`Input Sanitization: Title is '${t1.title}'`);
    recordTest("todo_list", "Sanitization", passed);
    checksPerformed.push("Sanitization");

    // Check UUID
    passed = (typeof t1.id === 'string' && (t1.id.startsWith('_') || t1.id.length === 36));
    if (passed) logPass("UUID: Generated correctly");
    else logFail(`UUID: Invalid format ${t1.id}`);
    recordTest("todo_list", "UUID", passed);
    checksPerformed.push("UUID");

    // 2. EDIT & VALIDATION
    list.edit(t1.id, { status: 'INVALID_STATUS' });
    passed = (t1.status === TaskStatus.TODO);
    if (passed) logPass("Validation: Invalid status rejected");
    else logFail("Validation: Invalid status accepted");
    recordTest("todo_list", "State Guard", passed);
    checksPerformed.push("State Guard");

    list.edit(t1.id, { status: TaskStatus.DONE, title: "Updated Task 1" });
    passed = (list.tasks[0].status === 'Done');
    if (passed) logPass("Edit: Valid status updated");
    else logFail("Edit: Update failed");
    recordTest("todo_list", "Edit", passed);
    checksPerformed.push("Edit");

    // 3. REORGANIZE
    // Move Task 3 (index 2) to top (index 0)
    list.reorganize(2, 0);
    passed = (list.tasks[0].id === t3.id && list.tasks[1].id === t1.id);
    if (passed) logPass("Reorganize: Task 3 moved to head");
    else logFail("Reorganize: Order incorrect");
    recordTest("todo_list", "Reorganize", passed);
    checksPerformed.push("Reorganize");

    // 4. DELETE
    list.delete(t2.id);
    passed = (list.tasks.length === 2 && !list.tasks.find(t => t.id === t2.id));
    if (passed) logPass("Delete: Removed correctly");
    else logFail("Delete: Failed");
    recordTest("todo_list", "Delete", passed, { final_count: list.tasks.length });
    checksPerformed.push("Delete");

    // Add summary metadata
    testArtifact.tests.todo_list.checks_performed = checksPerformed;
    testArtifact.tests.todo_list.final_task_count = list.tasks.length;
}

// ==========================================
// ARTIFACT WRITER
// ==========================================

function writeArtifact() {
    testArtifact.meta.execution_time_ms = Date.now() - testArtifact.meta.execution_start;
    delete testArtifact.meta.execution_start; // Clean up internal field

    const artifactPath = path.join(__dirname, '..', 'docs', 'test_summary.json');

    try {
        fs.writeFileSync(artifactPath, JSON.stringify(testArtifact, null, 2));
        console.log(`\n${colors.blue}[Artifact] Written to docs/test_summary.json${colors.reset}`);
    } catch (e) {
        console.error(`${colors.red}[Artifact] Failed to write: ${e.message}${colors.reset}`);
    }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

(function runAll() {
    console.log(`${colors.yellow}STARTING VERIFICATION...${colors.reset}`);

    let exitCode = 0;

    try {
        verifyShuffle();
        verifyPandigital();
        verifyTodoList();

        if (testArtifact.overall_status === "PASS") {
            console.log(`\n${colors.green}ALL SYSTEMS OPERATIONAL.${colors.reset}`);
        } else {
            console.log(`\n${colors.red}SOME TESTS FAILED.${colors.reset}`);
            exitCode = 1;
        }
    } catch (e) {
        console.error(`\n${colors.red}CRITICAL ERROR:${colors.reset}`, e);
        testArtifact.overall_status = "FAIL";
        testArtifact.critical_error = e.message;
        exitCode = 1;
    }

    // Always write artifact, even on failure
    writeArtifact();

    process.exit(exitCode);
})();
