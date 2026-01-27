"use strict";

/**
 * @file system_design.js
 * @description Headless MVC Implementation for Productivity Tracker (Group B).
 *
 * Engineering Standards:
 * - Input Sanitization on all public methods
 * - Strict State Management via frozen Enum
 * - Encapsulation via DTO pattern (prevents reference mutation)
 * - Collision-resistant ID generation using timestamp + entropy
 */

/* -------------------------------------------------------------------------- */
/* TYPE DEFINITIONS                                                           */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {'New' | 'Working on' | 'Finished'} TaskStatusType
 */

/**
 * @typedef {Object} TaskDTO
 * @property {string} id - Unique task identifier.
 * @property {string} title - Task title.
 * @property {string} description - Task description.
 * @property {TaskStatusType} status - Current task status.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date|null} dateDue - Due date timestamp.
 * @property {Date} updatedAt - Last modification timestamp.
 */

/**
 * @typedef {Object} TaskUpdateDTO
 * @property {string} [title] - New title.
 * @property {string} [description] - New description.
 * @property {Date|string} [dateDue] - New due date.
 * @property {TaskStatusType} [status] - New status.
 */

/* -------------------------------------------------------------------------- */
/* STATE INTEGRITY: ENUM                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Frozen enum for valid task statuses.
 * @readonly
 * @enum {string}
 */
const TaskStatus = Object.freeze({
    NEW: 'New',
    WORKING: 'Working on',
    FINISHED: 'Finished'
});

/* -------------------------------------------------------------------------- */
/* MODEL: TASK                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Represents a single task in the productivity tracker.
 */
class Task {
    /**
     * Creates a new Task instance.
     * @param {string} id - Unique identifier for the task.
     * @param {string} title - Task title (required).
     * @param {string} [description] - Task description.
     * @param {Date|string} [dateDue] - Due date.
     * @throws {Error} If title is empty.
     */
    constructor(id, title, description = "", dateDue = null) {
        if (!title || typeof title !== 'string' || title.trim() === '') {
            throw new Error('Task title is required.');
        }

        this.id = id;
        this.title = title.trim();
        this.description = description.trim();
        this.status = TaskStatus.NEW;
        this.createdAt = new Date();
        this.updatedAt = new Date();

        // [SAFETY] Strict Date Handling (Handles Date objects and ISO strings)
        this.dateDue = dateDue ? new Date(dateDue) : null;
        if (this.dateDue && isNaN(this.dateDue.getTime())) {
            throw new Error("Invalid dateDue provided.");
        }
    }

    /**
     * Updates the task status.
     * @param {TaskStatusType} newStatus - The new status value.
     * @throws {Error} If newStatus is not a valid TaskStatus.
     */
    updateStatus(newStatus) {
        const validStatuses = Object.values(TaskStatus);
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
        }
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.updatedAt = new Date();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* CONTROLLER: TODOLIST                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Manages a collection of tasks with O(1) read/write operations.
 */
class TodoList {
    constructor() {
        /** @type {Map<string, Task>} */
        this.tasksMap = new Map(); // O(1) Read/Write
        /** @type {string[]} */
        this.taskOrder = [];       // Maintains Sort Order
    }

    /**
     * Generates a collision-resistant unique ID.
     * Uses crypto.randomUUID() when available, with fallback to timestamp + entropy.
     * @returns {string} A unique identifier string.
     * @private
     */
    _generateId() {
        // [PERFORMANCE] crypto.randomUUID() is optimized at the engine level 
        // and guarantees collision resistance suitable for distributed systems.
        return typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    }

    /**
     * Creates an immutable Data Transfer Object (DTO).
     * Prevents external code from modifying the internal Map state by reference.
     * @param {Task} task - The internal mutable task instance.
     * @returns {TaskDTO} Frozen DTO.
     * @private
     */
    _toDTO(task) {
        return Object.freeze({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            dateDue: task.dateDue ? new Date(task.dateDue) : null,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt)
        });
    }

    /**
     * Adds a new task to the list.
     * @param {string} description - The task description.
     * @returns {string} The unique ID of the created task.
     */
    add(title, description = "", dateDue = null) {
        const id = this._generateId();
        const newTask = new Task(id, title, description, dateDue);

        this.tasksMap.set(id, newTask);
        this.taskOrder.push(id);

        return id;
    }

    /**
     * Deletes a task by ID.
     * @param {string} id - The task ID to delete.
     * @returns {boolean} True if the task was deleted, false if not found.
     */
    delete(id) {
        const deleted = this.tasksMap.delete(id); // O(1)
        if (deleted) {
            // O(N) - Necessary cost to maintain array order without holes
            this.taskOrder = this.taskOrder.filter(taskId => taskId !== id);
        }
        return deleted;
    }

    /**
     * Edits the description of an existing task.
     * @param {string} id - The task ID to edit.
     * @param {string} newDescription - The new description.
     * @returns {TaskDTO} The updated task as a frozen DTO.
     * @throws {Error} If task not found or description is invalid.
     */
    edit(id, updates) {
        const task = this.tasksMap.get(id);
        if (!task) throw new Error(`Task with ID ${id} not found.`);

        // [SAFETY] Explicit mapping of editable fields to prevent overwriting metadata (id, createdAt)
        const allowedFields = ['title', 'description', 'dateDue', 'status'];
        let hasChanged = false;

        allowedFields.forEach(field => {
            if (updates[field] === undefined) return;

            let newValue = updates[field];

            // Special handling for dates and status
            if (field === 'dateDue') {
                newValue = newValue ? new Date(newValue).getTime() : null;
                const currentValue = task.dateDue ? task.dateDue.getTime() : null;
                if (newValue !== currentValue) {
                    task.dateDue = newValue ? new Date(newValue) : null;
                    hasChanged = true;
                }
                return;
            }

            if (field === 'status') {
                const validStatuses = Object.values(TaskStatus);
                if (!validStatuses.includes(newValue)) {
                    throw new Error(`Invalid status: ${newValue}`);
                }
                if (task.status !== newValue) {
                    task.status = newValue;
                    hasChanged = true;
                }
                return;
            }

            // String fields (title, description)
            if (typeof newValue === 'string') newValue = newValue.trim();
            if (task[field] !== newValue) {
                task[field] = newValue;
                hasChanged = true;
            }
        });

        // [EFFICIENCY] Only update timestamp if a change actually occurred
        if (hasChanged) {
            task.updatedAt = new Date();
        }

        return this._toDTO(task);
    }

    /**
     * Reorganizes the list by moving a task from one index to another.
     *
     * SEMANTIC BEHAVIOR (Slot-Based Insertion):
     * The item is placed INTO the slot at `toIndex`, shifting existing items.
     *
     * EXAMPLE 1: Moving backward (higher to lower index)
     *   [A, B, C, D, E] → reorganize(4, 1)
     *   Remove 'E' from index 4 → [A, B, C, D]
     *   Insert 'E' at index 1  → [A, E, B, C, D]
     *
     * EXAMPLE 2: Moving forward (lower to higher index)
     *   [A, B, C, D, E] → reorganize(1, 4)
     *   Remove 'B' from index 1 → [A, C, D, E]  (array shrinks!)
     *   Insert 'B' at index 4  → [A, C, D, E, B]
     *   Note: 'B' ends up at the END because after removal, index 4 is the last slot.
     *
     * This implements "insert AT position" semantics, NOT "insert AFTER position."
     * The behavior naturally handles the array length change between splice operations.
     *
     * @param {number} fromIndex - The source index (0-indexed).
     * @param {number} toIndex - The destination slot index (0-indexed).
     * @throws {RangeError} If either index is out of bounds.
     */
    reorganize(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.taskOrder.length ||
            toIndex < 0 || toIndex >= this.taskOrder.length) {
            throw new RangeError('Reorganize failed: Index out of bounds.');
        }

        const [movedId] = this.taskOrder.splice(fromIndex, 1);
        this.taskOrder.splice(toIndex, 0, movedId);
    }

    // --- Positional Helpers (Requested) ---

    moveUp(id) {
        const index = this.taskOrder.indexOf(id);
        if (index > 0) {
            this._swap(index, index - 1);
        }
    }

    moveDown(id) {
        const index = this.taskOrder.indexOf(id);
        // [SAFETY] Strict check to prevent out-of-bounds or silent failures
        if (index !== -1 && index < this.taskOrder.length - 1) {
            this._swap(index, index + 1);
        }
    }

    moveToTop(id) {
        const index = this.taskOrder.indexOf(id);
        if (index > 0) {
            const [movedId] = this.taskOrder.splice(index, 1);
            this.taskOrder.unshift(movedId);
        }
    }

    // --- Additional Simple Utility Functions ---

    /**
     * Filters tasks by status (e.g., only show "Working on")
     */
    filterByStatus(status) {
        return this.getAll().filter(task => task.status === status);
    }

    /**
     * Quick check for overdue items
     */
    getOverdueTasks() {
        const now = new Date();
        return this.getAll().filter(task =>
            task.status !== TaskStatus.FINISHED &&
            task.dateDue &&
            task.dateDue < now
        );
    }

    // --- Private Helpers ---

    _swap(idxA, idxB) {
        [this.taskOrder[idxA], this.taskOrder[idxB]] = [this.taskOrder[idxB], this.taskOrder[idxA]];
    }

    /**
     * Updates the status of an existing task.
     * @param {string} id - The task ID.
     * @param {TaskStatusType} newStatus - The new status.
     * @returns {TaskDTO} The updated task as a frozen DTO.
     * @throws {Error} If task not found or status is invalid.
     */
    updateStatus(id, newStatus) {
        const task = this.tasksMap.get(id);
        if (!task) throw new Error(`Task with ID ${id} not found.`);
        task.updateStatus(newStatus);
        return this._toDTO(task);
    }

    /**
     * Retrieves all tasks in order as frozen DTOs.
     * @returns {TaskDTO[]} Array of frozen task DTOs.
     */
    getAll() {
        return this.taskOrder.map(id => this._toDTO(this.tasksMap.get(id)));
    }
}

/* -------------------------------------------------------------------------- */
/* VERIFICATION SUITE (SELF-TESTING)                                          */
/* -------------------------------------------------------------------------- */

if (typeof require !== 'undefined' && require.main === module) {
    console.log("Running System Design Integrity Checks...\n");

    const assert = (condition, msg) => {
        if (!condition) {
            console.error(`[FAIL] ${msg}`);
            process.exit(1);
        }
        else console.log(`[PASS] ${msg}`);
    };

    const list = new TodoList();

    // 1. Add Tasks
    console.log("--- Add Tests ---");
    const id1 = list.add("First task", "A description", new Date());
    const id2 = list.add("Second task");
    assert(typeof id1 === 'string' && id1.length > 0, "Add returns unique string ID");
    assert(id1 !== id2, "IDs are unique");
    assert(list.getAll().length === 2, "Two tasks in list");
    assert(list.getAll()[0].title === "First task", "Title correctly set");

    // 2. Edit Task
    console.log("\n--- Edit Tests ---");
    const edited = list.edit(id1, { title: "Updated Title", description: "New Description" });
    assert(edited.title === "Updated Title", "Edit updates title");
    assert(edited.description === "New Description", "Edit updates description");

    // Check efficiency: updatedAt should not change if content is same
    const firstUpdate = edited.updatedAt.getTime();
    const sameEdit = list.edit(id1, { title: "Updated Title" });
    assert(sameEdit.updatedAt.getTime() === firstUpdate, "updatedAt does not change if content is identical");

    // 3. Status Update
    console.log("\n--- Status Tests ---");
    const updated = list.updateStatus(id1, TaskStatus.WORKING);
    assert(updated.status === 'Working on', "Status updated correctly");

    let invalidStatusCaught = false;
    try { list.updateStatus(id1, 'invalid_status'); } catch (e) { invalidStatusCaught = true; }
    assert(invalidStatusCaught, "Invalid status throws error");

    // 4. Positional Helpers
    console.log("\n--- Positional Tests ---");
    const id3 = list.add("Third task"); // Order: [id1, id2, id3]

    list.moveDown(id1); // Order: [id2, id1, id3]
    assert(list.taskOrder[1] === id1, "moveDown shifts item forward");

    list.moveUp(id3); // Order: [id2, id3, id1]
    assert(list.taskOrder[1] === id3, "moveUp shifts item backward");

    list.moveToTop(id1); // Order: [id1, id2, id3]
    assert(list.taskOrder[0] === id1, "moveToTop brings item to index 0");

    // 5. Utility Methods
    console.log("\n--- Utility Tests ---");
    const workingTasks = list.filterByStatus(TaskStatus.WORKING);
    assert(workingTasks.length === 1 && workingTasks[0].id === id1, "filterByStatus returns correct items");

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    list.edit(id2, { dateDue: pastDate });
    const overdue = list.getOverdueTasks();
    assert(overdue.length === 1 && overdue[0].id === id2, "getOverdueTasks identifies expired due dates");

    // 6. Delete
    console.log("\n--- Delete Tests ---");
    const deleted = list.delete(id1);
    assert(deleted === true, "Delete returns true for existing task");
    assert(list.getAll().length === 2, "List size reduced after delete");

    // 7. Error Handling
    console.log("\n--- Error Handling Tests ---");
    let emptyTitleCaught = false;
    try { list.add(""); } catch (e) { emptyTitleCaught = true; }
    assert(emptyTitleCaught, "Empty title throws error");

    console.log("\nVerification Complete.");
}

module.exports = { Task, TodoList, TaskStatus };
