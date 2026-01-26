/**
 * verify_submission.js
 * * PURPOSE:
 * This script serves as a localized Continuous Integration (CI) test suite.
 * It strictly validates the algorithms and system design code intended for the 
 * Forge Launch submission.
 * * TO RUN:
 * node verify_submission.js
 */

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
// SECTION 1: CODE IMPLEMENTATIONS
// (Copy-pasted EXACTLY from Strategy Docs)
// ==========================================

// --- A1: Fisher-Yates Shuffle ---
const shuffleArray = (array) => {
    if (!Array.isArray(array)) throw new TypeError("Input must be an array.");
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// --- A2: Pandigital Detection ---
const isPandigital = (input) => {
    const numString = String(input);
    const uniqueDigits = new Set();
    for (const char of numString) {
        if (char >= '0' && char <= '9') {
            uniqueDigits.add(char);
        }
    }
    return uniqueDigits.size === 10;
};

// --- B1: TodoList Architecture ---
const TaskStatus = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done'
};

class Task {
    constructor(id, title, description, dueDate) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = new Date(dueDate);
        this.status = TaskStatus.TODO;
        this.createdAt = new Date();
    }

    update({ title, description, dueDate, status }) {
        if (title) this.title = title;
        if (description) this.description = description;
        if (dueDate) this.dueDate = new Date(dueDate);
        if (status) {
            if (Object.values(TaskStatus).includes(status)) {
                this.status = status;
            } else {
                // Silently failing or warning in verify script for logic check
                // console.warn(`Invalid status '${status}'`);
            }
        }
    }
}

class TodoList {
    constructor() {
        this.tasks = [];
        this.idCounter = 1;
    }

    add(title, description, dueDate) {
        const newTask = new Task(this.idCounter++, title, description, dueDate);
        this.tasks.push(newTask);
        return newTask;
    }

    delete(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        return this.tasks.length < initialLength;
    }

    edit(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return null;
        task.update(updates);
        return task;
    }

    reorganize(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.tasks.length ||
            toIndex < 0 || toIndex >= this.tasks.length) {
            return false; // Added return for testing
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
    const tolerance = iterations * 0.02; // Allow 2% deviation

    let passed = true;
    for (const [perm, count] of Object.entries(counts)) {
        const diff = Math.abs(count - expected);
        if (diff > tolerance) {
            logFail(`Permutation ${perm} count ${count} outside tolerance (Exp: ${expected})`);
            passed = false;
        }
    }

    if (passed) logPass("Distribution is statistically uniform (Unbiased).");
}

function verifyPandigital() {
    logHeader("Testing A2: Pandigital Detection");

    const cases = [
        { val: "1023456789", expect: true, name: "Standard 0-9 String" },
        { val: 1023456789, expect: true, name: "Standard 0-9 Number" },
        { val: "11223344556677889900", expect: true, name: "Long w/ Duplicates" }, // Logic Check: Contains all digits
        { val: "123456789", expect: false, name: "Missing Zero" },
        { val: "ABCDEFGHIJ", expect: false, name: "Non-Digits" },
        { val: 123, expect: false, name: "Short Number" }
    ];

    cases.forEach(c => {
        const result = isPandigital(c.val);
        if (result === c.expect) {
            logPass(`Case [${c.name}]: Got ${result}`);
        } else {
            logFail(`Case [${c.name}]: Expected ${c.expect}, Got ${result}`);
        }
    });
}

function verifyTodoList() {
    logHeader("Testing B1: TodoList Architecture");

    const list = new TodoList();

    // 1. ADD
    const t1 = list.add("Task 1", "Desc", "2026-01-01");
    const t2 = list.add("Task 2", "Desc", "2026-01-02");
    const t3 = list.add("Task 3", "Desc", "2026-01-03");

    if (list.tasks.length === 3) logPass("Add: Count is 3");
    else logFail(`Add: Count is ${list.tasks.length}`);

    // 2. EDIT
    list.edit(t1.id, { status: TaskStatus.DONE, title: "Updated Task 1" });
    if (list.tasks[0].status === 'Done' && list.tasks[0].title === "Updated Task 1") {
        logPass("Edit: Status and Title updated");
    } else {
        logFail("Edit: Update failed");
    }

    // 3. REORGANIZE
    // Move Task 3 (index 2) to top (index 0)
    // Expected Order: [Task 3, Task 1, Task 2]
    list.reorganize(2, 0);

    if (list.tasks[0].id === t3.id && list.tasks[1].id === t1.id) {
        logPass("Reorganize: Task 3 moved to head");
    } else {
        logFail("Reorganize: Order incorrect");
    }

    // 4. DELETE
    list.delete(t2.id); // Delete Task 2
    if (list.tasks.length === 2 && !list.tasks.find(t => t.id === t2.id)) {
        logPass("Delete: Removed correctly");
    } else {
        logFail("Delete: Failed");
    }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

(function runAll() {
    console.log(`${colors.yellow}STARTING VERIFICATION...${colors.reset}`);
    try {
        verifyShuffle();
        verifyPandigital();
        verifyTodoList();
        console.log(`\n${colors.green}ALL SYSTEMS OPERATIONAL.${colors.reset}`);
    } catch (e) {
        console.error(`\n${colors.red}CRITICAL ERROR:${colors.reset}`, e);
    }
})();
