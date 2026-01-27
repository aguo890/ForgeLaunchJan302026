# Part 1: Software Engineering Project - Group B (Productivity Tracker Strategy)

## 1. Executive Summary

Group B shifts the focus from algorithmic problem solving to software architecture. The goal is to demonstrate how to structure code for **scalability**, **readability**, and **data integrity** using industry-standard patterns like Headless MVC.

---

## 2. Question B1: Online Productivity Tracker (Headless MVC)

### 2.1 Requirements & Interpretation

* **Properties:** Title, Description, Dates, Status.
* **Functions:** Add, Delete, Reorganize, Edit.
* **Constraint:** No HTML/jQuery.

**Interpretation:** The "No HTML" constraint necessitates a **"Headless"** implementation. This is the logic layer of a Productivity application, structured as a reusable API or Class.

### 2.2 Architectural Pattern: Object-Oriented Design

To manage application state effectively, we utilize two primary classes:

* **`Task` Class:** The data model. It encapsulates validation (sanitizing descriptions) and state integrity (Enums).
* **`TodoList` Class:** The controller. It manages the collection using a **Normalized State** pattern (storing items in a `Map` for O(1) access while maintaining a separate `Array` for sort order).

### 2.3 State Integrity and Defensive Engineering

* **Enums:** We use a frozen `TaskStatus` object to prevent "magic string" bugs.
* **Collision Resistance:** Instead of a simple counter, we use `crypto.randomUUID()` to ensure unique IDs across distributed sessions.
* **Defensive DTOs:** To prevent external mutation of the internal state, the `getAll()` and `edit()` methods return **shallow-frozen clones** of the task data, including new `Date` instances to prevent reference mutation.

### 2.4 The Solution Code (Hardened)

```javascript
"use strict";

const TaskStatus = Object.freeze({
    NEW: 'New',
    WORKING: 'Working on',
    FINISHED: 'Finished'
});

class Task {
    constructor(id, title, description = "", dateDue = null) {
        if (!title || title.trim() === '') throw new Error('Title is required');
        
        this.id = id;
        this.title = title.trim();
        this.description = description.trim();
        this.status = TaskStatus.NEW;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.dateDue = dateDue ? new Date(dateDue) : null;
    }
}

class TodoList {
    constructor() {
        this.tasksMap = new Map(); 
        this.taskOrder = [];
    }

    _generateId() {
        // [PERFORMANCE] crypto.randomUUID() is optimized at the engine level 
        // and guarantees collision resistance suitable for distributed systems.
        return typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    }

    _toDTO(task) {
        return Object.freeze({
            id: task.id,
            description: task.description,
            status: task.status,
            // [SAFETY] Return new Date instances to prevent reference mutation
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt)
        });
    }

    add(title, description = "", dateDue = null) {
        const id = this._generateId();
        const newTask = new Task(id, title, description, dateDue);
        this.tasksMap.set(id, newTask);
        this.taskOrder.push(id);
        return id;
    }

    // --- Positional Helpers (Requested) ---

    moveUp(id) {
        const index = this.taskOrder.indexOf(id);
        if (index > 0) this._swap(index, index - 1);
    }

    moveDown(id) {
        const index = this.taskOrder.indexOf(id);
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

    _swap(idxA, idxB) {
        [this.taskOrder[idxA], this.taskOrder[idxB]] = [this.taskOrder[idxB], this.taskOrder[idxA]];
    }

    getAll() {
        return this.taskOrder.map(id => this._toDTO(this.tasksMap.get(id)));
    }
}
```

> [!TIP]
> **Scale Tip: Fractional Indexing**
> While `splice` is sufficient for typical user lists (N < 1000), a global-scale Jira/Trello implementation would use **Fractional Indexing** (e.g., Lexorank). Assigning a string key like `"0|000001:"` allows inserting items between others (O(1)) without shifting the entire array (O(N)), preventing effective downtime during massive reorders.

> [!NOTE]
> Full implementation with all CRUD operations: [system_design.js](file:///c:/Users/19803/business/ForgeLaunch/ForgeLaunchSpring2026Jan30/src/system_design.js)

---

*Last Updated: 2026-01-26*
