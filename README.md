# Forge Launch Spring 2026 — Skills Challenge

A comprehensive submission for the Forge Launch Software Engineering Skills Challenge, demonstrating proficiency in **algorithms**, **system design**, **database modeling**, and **clean code practices**.

---

## 📁 Repository Structure

```
ForgeLaunchSpring2026Jan30/
├── src/                    # Core implementations
├── test/                   # Unit tests & benchmarks
├── docs/                   # Strategy docs, essays, QA reports
├── submission/             # Final deliverables
├── scripts/                # Automation utilities
├── Makefile                # Task runner
└── STRATEGY_ANALYSIS.md    # Deep-dive technical analysis
```

---

## 🚀 Quick Start

### Requirements
| Tool      | Version   |
|-----------|-----------|
| Node.js   | v22.17+   |
| Python    | v3.13+    |
| Make      | (optional)|

### Setup
```bash
pip install openai python-dotenv   # For automation scripts
```

### Run Tests
```bash
make test                          # Runs all unit tests via Node.js
node --test test/*.test.js         # Direct command (no Make)
```

---

## 📂 Directory Guide

### `src/` — Core Implementations

| File | Description | Key Exports |
|------|-------------|-------------|
| **`algorithms.js`** | Group A algorithms: Fisher-Yates shuffle with crypto entropy, 0-9 Pandigital detection via bitmask | `shuffleArray`, `isPandigital` |
| **`system_design.js`** | Group B: Headless MVC TodoList with O(1) operations, immutable DTOs, TaskStatus enum | `TodoList`, `Task`, `TaskStatus` |
| **`url_shortener.js`** | Bonus: URL shortening service implementation | — |

### `test/` — Test Suite

| File | Purpose |
|------|---------|
| **`algorithms.test.js`** | Unit tests for shuffle & pandigital (edge cases, entropy) |
| **`system_design.test.js`** | Unit tests for TodoList CRUD, reorganize, state guards |
| **`performance_benchmark.test.js`** | Performance regression tests |
| **`security_audit.test.js`** | Security validation (input sanitization, state protection) |
| **`benchmark.js`** | Standalone performance benchmarking utility |

### `docs/` — Documentation

| File | Description |
|------|-------------|
| **`algorithms_strategy.md`** | Technical deep-dive on algorithm design decisions |
| **`system_design_strategy.md`** | Architecture rationale for ProductivityTracker |
| **`essays.md`** | Short essays (personal story + internship goals) + meta-questions |
| **`qa_report.md`** | QA verification report with test execution logs |
| **`development_log.md`** | Iteration history and design decision changelog |
| **`test_summary.json`** | Machine-readable test results artifact |

### `submission/` — Final Deliverables

| File | Description |
|------|-------------|
| **`MASTER_SUBMISSION.txt`** | Plain-text submission for copy-paste delivery |
| **`SUBMISSION_PREVIEW.md`** | Formatted markdown preview of final submission |

### `scripts/` — Automation

| Script | Command | Description |
|--------|---------|-------------|
| **`verify_submission.js`** | `node scripts/verify_submission.js` | Runs comprehensive test suite, outputs `test_summary.json` |
| **`autocommit.py`** | `make push` | AI-powered git commit message generation |
| **`update_docs.py`** | `make docs` | AI-assisted documentation updates |

---

## 🔧 Makefile Commands

| Command | Description |
|---------|-------------|
| `make test` | Run all unit tests |
| `make docs` | Update strategy documentation via AI |
| `make push` | Auto-commit with AI-generated message |
| `make smart-push` | Run `docs` then `push` sequentially |
| `make branch <name>` | Create and push a new Git branch |

---

## ✅ Implementation Checklist

- [x] **A1:** Fisher-Yates Shuffle (cryptographic entropy)
- [x] **A2:** Pandigital Number Detection (bitmask strategy)
- [x] **B1:** ProductivityTracker (Headless MVC architecture)
- [x] **B2:** Database Schema (3NF normalized ERD)
- [x] **Essays:** Personal narrative + internship goals + meta-questions

---

## 🔗 Key Files for Reviewers

| What You're Looking For | Where to Find It |
|-------------------------|------------------|
| Algorithm implementations | [`src/algorithms.js`](./src/algorithms.js) |
| System design / TodoList | [`src/system_design.js`](./src/system_design.js) |
| All tests passing | Run `make test` |
| Written essays | [`docs/essays.md`](./docs/essays.md) |
| QA proof of correctness | [`docs/qa_report.md`](./docs/qa_report.md) |
| Final submission text | [`submission/MASTER_SUBMISSION.txt`](./submission/MASTER_SUBMISSION.txt) |
| Technical strategy | [`STRATEGY_ANALYSIS.md`](./STRATEGY_ANALYSIS.md) |

---

## 📖 Further Reading

- **[`STRATEGY_ANALYSIS.md`](./STRATEGY_ANALYSIS.md)** — 34KB deep-dive into design philosophy, algorithm analysis, and architectural decisions.
- **[`docs/development_log.md`](./docs/development_log.md)** — Full changelog of iterations and refinements.
