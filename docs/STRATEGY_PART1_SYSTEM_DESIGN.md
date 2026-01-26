# Part 1: Software Engineering Project - Group B (System Design)

## 1. Executive Summary
Group B shifts the focus from algorithmic problem solving to software architecture. The goal here is to demonstrate how to structure code for scalability, readability, and data integrity.

## 2. Question B1: Online Productivity Tracker (Headless MVC)

### 2.1 Requirements & Interpretation
*   **Properties:** Title, Description, Dates, Status.
*   **Functions:** Add, Delete, Reorganize, Edit.
*   **Constraint:** No HTML/jQuery.

**Interpretation:** The "No HTML" constraint implies a **"Headless"** or **"Model-Controller"** implementation. We are building the logic layer of a To-Do application. The solution should be structured as a reusable API or Class that a frontend framework (like React or Vue) could theoretically consume.

### 2.2 Architectural Pattern: Object-Oriented Design
To manage the state of the application effectively, we should use Classes.

*   **`Task` Class:** Represents the data model of a single item. It encapsulates validation logic (e.g., ensuring a status is valid).
*   **`TodoList` Class:** Represents the controller/manager. It holds the array of tasks and provides methods to manipulate them.

This separation of concerns is critical. The `TodoList` shouldn't worry about how a `Task` formats its date; the `Task` shouldn't worry about where it sits in the list.

### 2.3 State Management and Enums
Magic strings (e.g., checking `if (status === 'done')`) are a source of bugs (typos like 'Done' or 'completed'). We will use a JavaScript object as an **Enum** to define valid statuses, ensuring type safety across the application.

### 2.4 The "Reorganize" Challenge
The requirement to "reorganize list" implies moving an item from index A to index B. This requires careful array manipulation using `splice`.
*   **Mechanism:** `array.splice(fromIndex, 1)` removes the item. `array.splice(toIndex, 0, item)` inserts it.
*   **Validation:** We must ensure indices are within bounds to prevent runtime errors.

### 2.5 The Solution Code
```javascript
/**
 * SECTION: Productivity Tracker
 * ARCHITECTURE: Headless Object-Oriented Model
 * 
 * We utilize a Class-based architecture to encapsulate state and logic.
 * - TaskStatus: An Enum-like object to prevent magic string errors.
 * - Task: A model class representing individual work units.
 * - TodoList: A controller class managing the collection and operations.
 */

// Define valid statuses as constants to ensure data integrity
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
        console.warn(`Invalid status '${status}'. Update ignored.`);
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
      console.error("Reorganize failed: Index out of bounds.");
      return;
    }
    const [movedTask] = this.tasks.splice(fromIndex, 1);
    this.tasks.splice(toIndex, 0, movedTask);
  }
}
```

---

## 3. Question B2: Database Design (Relational Schema)

### 3.1 Conceptual Analysis: Entities and Relationships
The prompt asks for a design for "people met in college" covering classes, clubs, and personal info. 

**Core Entities:**
*   `STUDENT` (The central entity)
*   `CLASS` (Academic course)
*   `CLUB` (Extracurricular)

**Relationship Analysis:**
*   **Student ↔ Class:** A student takes many classes; a class has many students. **(Many-to-Many / M:N)**
*   **Student ↔ Club:** A student joins many clubs; a club has many members. **(Many-to-Many / M:N)**

**Crucial Insight:** In relational databases, M:N relationships *cannot* be represented directly. They require a **Junction Table** (Associative Entity).

### 3.2 Normalization (Redundancy Prevention)
The prompt explicitly asks about "redundancy prevention." This refers to **Database Normalization (3NF)**.
*   **1NF (First Normal Form):** We do not store lists in columns. No `Classes_Taken` column with "Math 101, CS 102". We use a junction table.
*   **2NF (Second Normal Form):** Check for partial dependencies. We don't store `Professor_Name` in the `ENROLLMENT` table. That belongs in `CLASS`.
*   **3NF (Third Normal Form):** Transitive dependencies removed.

### 3.3 Visual Representation (Mermaid.js)
The following Entity-Relationship Diagram (ERD) visualizes this schema.

```mermaid
erDiagram
    STUDENT ||--o{ ENROLLMENT : "enrolls in"
    CLASS ||--o{ ENROLLMENT : "contains"
    STUDENT ||--o{ CLUB_MEMBERSHIP : "joins"
    CLUB ||--o{ CLUB_MEMBERSHIP : "has members"

    STUDENT {
        int student_id PK
        string first_name
        string last_name
        string email
    }

    CLASS {
        string course_code PK "e.g., CS-101"
        string course_name
        string professor_name
        string location
    }

    CLUB {
        int club_id PK
        string club_name
        string president_name
    }

    ENROLLMENT {
        int enrollment_id PK
        int student_id FK
        string course_code FK
        string grade
    }

    CLUB_MEMBERSHIP {
        int membership_id PK
        int student_id FK
        int club_id FK
        string role "e.g. Member, Treasurer"
    }
```

### 3.4 Schema Description (Narrative)
*   **Organization:** The database is organized into three strong entity tables (`STUDENT`, `CLASS`, `CLUB`) and two associative tables (`ENROLLMENT`, `CLUB_MEMBERSHIP`).
*   **Referential Integrity:** Foreign Keys (FK) in the associative tables link back to the strong entities. You cannot enroll a non-existent student.
*   **Redundancy Prevention:** By adhering to 3NF, the `meeting_time` of a club is stored exactly once in the `CLUB` table. If the meeting time changes, we update one record, not every student's record.
