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
        this.tasks = [];
        this._idCounter = 1; // Simple ID generation for this scope
    }

    add(description) {
        const id = this._idCounter++;
        const newTask = new Task(id, description);
        this.tasks.push(newTask);
        return newTask.id;
    }

    delete(id) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(task => task.id !== id);
        return this.tasks.length < initialLength; // Returns true if deleted
    }

    edit(id, newDescription) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) {
            throw new Error(`Task with ID ${id} not found.`);
        }
        if (!newDescription || typeof newDescription !== 'string' || newDescription.trim() === '') {
            throw new Error('New description must be a non-empty string.');
        }
        task.description = newDescription.trim();
        return task;
    }

    /**
     * Reorganizes the list by moving a task from one index to another.
     * Complexity: O(N) due to Array.splice. 
     * NOTE: While O(N) is acceptable for small user lists, large-scale implementations 
     * should consider Doubly Linked Lists or Lexicographical Rank Indexing.
     * @param {number} fromIndex 
     * @param {number} toIndex 
     */
    reorganize(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.tasks.length ||
            toIndex < 0 || toIndex >= this.tasks.length) {
            throw new RangeError(`Reorganize failed: Index ${fromIndex} or ${toIndex} is out of bounds (valid: 0..${this.tasks.length - 1}).`);
        }

        const [movedTask] = this.tasks.splice(fromIndex, 1);
        this.tasks.splice(toIndex, 0, movedTask);
    }

    getAll() {
        return [...this.tasks]; // Return copy to prevent direct mutation of array reference
    }
}

module.exports = { Task, TodoList, TaskStatus };
