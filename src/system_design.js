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
 * @typedef {'pending' | 'in_progress' | 'completed'} TaskStatusType
 */

/**
 * @typedef {Object} TaskDTO
 * @property {string} id - Unique task identifier.
 * @property {string} description - Task description.
 * @property {TaskStatusType} status - Current task status.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last modification timestamp.
 */

/**
 * @typedef {Object} TaskUpdateDTO
 * @property {string} [description] - New description for the task.
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
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
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
     * @param {string} description - Task description (will be trimmed).
     * @throws {Error} If description is empty or not a string.
     */
    constructor(id, description) {
        if (!description || typeof description !== 'string' || description.trim() === '') {
            throw new Error('Task description must be a non-empty string.');
        }

        this.id = id;
        this.description = description.trim(); // [SAFETY] Input Sanitization
        this.status = TaskStatus.PENDING;
        this.createdAt = new Date();
        this.updatedAt = new Date(); // [AUDIT] Track modification time
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
        this.status = newStatus;
        this.updatedAt = new Date(); // [AUDIT] Update timestamp on change
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
     * Uses timestamp + random entropy for uniqueness across sessions.
     * @returns {string} A unique identifier string.
     * @private
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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
            description: task.description,
            status: task.status,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt // [AUDIT] Expose modification trail
        });
    }

    /**
     * Adds a new task to the list.
     * @param {string} description - The task description.
     * @returns {string} The unique ID of the created task.
     */
    add(description) {
        const id = this._generateId();
        const newTask = new Task(id, description);

        // [PATTERN] Normalized State: Store by ID, Track Order separately
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
    edit(id, newDescription) {
        if (!this.tasksMap.has(id)) {
            throw new Error(`Task with ID ${id} not found.`);
        }

        const task = this.tasksMap.get(id);

        // [SAFETY] Validation
        if (!newDescription || typeof newDescription !== 'string' || newDescription.trim() === '') {
            throw new Error('New description must be a non-empty string.');
        }

        task.description = newDescription.trim();
        task.updatedAt = new Date(); // [AUDIT] Update timestamp on change

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

        // [PATTERN] Two-phase splice: Remove, then insert at target position
        // The array automatically adjusts indices between operations.
        const [movedId] = this.taskOrder.splice(fromIndex, 1);
        this.taskOrder.splice(toIndex, 0, movedId);
    }

    /**
     * Updates the status of an existing task.
     * @param {string} id - The task ID.
     * @param {TaskStatusType} newStatus - The new status.
     * @returns {TaskDTO} The updated task as a frozen DTO.
     * @throws {Error} If task not found or status is invalid.
     */
    updateStatus(id, newStatus) {
        if (!this.tasksMap.has(id)) {
            throw new Error(`Task with ID ${id} not found.`);
        }

        const task = this.tasksMap.get(id);
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
        if (!condition) console.error(`[FAIL] ${msg}`);
        else console.log(`[PASS] ${msg}`);
    };

    const list = new TodoList();

    // 1. Add Tasks
    console.log("--- Add Tests ---");
    const id1 = list.add("First task");
    const id2 = list.add("Second task");
    assert(typeof id1 === 'string' && id1.length > 0, "Add returns unique string ID");
    assert(id1 !== id2, "IDs are unique");
    assert(list.getAll().length === 2, "Two tasks in list");

    // 2. Edit Task
    console.log("\n--- Edit Tests ---");
    const edited = list.edit(id1, "Updated first task");
    assert(edited.description === "Updated first task", "Edit updates description");
    assert(Object.isFrozen(edited), "Edit returns frozen DTO");

    // 3. Status Update
    console.log("\n--- Status Tests ---");
    const updated = list.updateStatus(id1, TaskStatus.IN_PROGRESS);
    assert(updated.status === 'in_progress', "Status updated correctly");

    let invalidStatusCaught = false;
    try { list.updateStatus(id1, 'invalid_status'); } catch (e) { invalidStatusCaught = true; }
    assert(invalidStatusCaught, "Invalid status throws error");

    // 4. Reorganize
    console.log("\n--- Reorganize Tests ---");
    list.reorganize(0, 1);
    assert(list.getAll()[0].id === id2, "Reorganize swaps positions");

    // 5. Delete
    console.log("\n--- Delete Tests ---");
    const deleted = list.delete(id1);
    assert(deleted === true, "Delete returns true for existing task");
    assert(list.getAll().length === 1, "One task remaining after delete");

    const deletedAgain = list.delete(id1);
    assert(deletedAgain === false, "Delete returns false for non-existent task");

    // 6. Error Handling
    console.log("\n--- Error Handling Tests ---");
    let emptyDescCaught = false;
    try { list.add(""); } catch (e) { emptyDescCaught = true; }
    assert(emptyDescCaught, "Empty description throws error");

    let notFoundCaught = false;
    try { list.edit("nonexistent", "test"); } catch (e) { notFoundCaught = true; }
    assert(notFoundCaught, "Edit non-existent task throws error");

    console.log("\nVerification Complete.");
}

module.exports = { Task, TodoList, TaskStatus };
