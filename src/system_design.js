/**
 * @fileoverview Headless MVC Implementation for Productivity Tracker
 * Adheres to High-Insight Engineering Standards: 
 * - Input Sanitization
 * - Strict State Management (Enums)
 * - Error Boundary Handling
 */

// 1. State Integrity: Enum for Task Status
const TaskStatus = Object.freeze({
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
});

// 2. Model: Task (Encapsulation of Data & Validation)
class Task {
    constructor(id, description) {
        if (!description || typeof description !== 'string' || description.trim() === '') {
            throw new Error('Task description must be a non-empty string.');
        }

        this.id = id;
        this.description = description.trim(); // Input Sanitization
        this.status = TaskStatus.PENDING;
        this.createdAt = new Date();
    }

    updateStatus(newStatus) {
        const validStatuses = Object.values(TaskStatus);
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
        }
        this.status = newStatus;
    }
}

// 3. Controller: TodoList (Collection Management)
class TodoList {
    constructor() {
        this.tasksMap = new Map(); // O(1) Read/Write
        this.taskOrder = [];       // Maintains Sort Order
        this._idCounter = 1;
    }

    /**
     * Creates an immutable Data Transfer Object (DTO).
     * Prevents external code from modifying the internal Map state by reference.
     * @param {Task} task - The internal mutable task instance
     * @returns {Object} - Frozen DTO
     */
    _toDTO(task) {
        return Object.freeze({
            id: task.id,
            description: task.description,
            status: task.status,
            createdAt: task.createdAt
        });
    }

    add(description) {
        const id = this._idCounter++;
        const newTask = new Task(id, description);

        // Normalized State: Store by ID, Track Order separately
        this.tasksMap.set(id, newTask);
        this.taskOrder.push(id);

        return newTask.id;
    }

    delete(id) {
        const deleted = this.tasksMap.delete(id); // O(1)
        if (deleted) {
            // O(N) - Necessary cost to maintain array order without holes
            this.taskOrder = this.taskOrder.filter(taskId => taskId !== id);
        }
        return deleted;
    }

    edit(id, newDescription) {
        // O(1) Lookup
        if (!this.tasksMap.has(id)) {
            throw new Error(`Task with ID ${id} not found.`);
        }

        const task = this.tasksMap.get(id);

        // Validation
        if (!newDescription || typeof newDescription !== 'string' || newDescription.trim() === '') {
            throw new Error('New description must be a non-empty string.');
        }

        task.description = newDescription.trim();

        // Return Safe DTO
        return this._toDTO(task);
    }

    /**
     * Reorganizes the list by moving a task from one index to another.
     * @param {number} fromIndex 
     * @param {number} toIndex 
     */
    reorganize(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.taskOrder.length ||
            toIndex < 0 || toIndex >= this.taskOrder.length) {
            throw new RangeError(`Reorganize failed: Index out of bounds.`);
        }

        const [movedId] = this.taskOrder.splice(fromIndex, 1);
        this.taskOrder.splice(toIndex, 0, movedId);
    }

    getAll() {
        // Map the ID order to actual DTOs
        return this.taskOrder.map(id => this._toDTO(this.tasksMap.get(id)));
    }
}

module.exports = { Task, TodoList, TaskStatus };
