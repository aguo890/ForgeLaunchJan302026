# Forge Launch Spring 2026 - Skills Challenge

## Overview
This repository contains the implementation for the Forge Launch Software Engineering Skills Challenge. It demonstrates proficiency in modern JavaScript, algorithmic problem solving, system design, and database modeling, all while adhering to the principles of clean code and impact-driven engineering.

For a deep dive into the technical strategy and analysis, please see [STRATEGY_ANALYSIS.md](./STRATEGY_ANALYSIS.md).

## Requirements
* **Node.js**: v22.17+
* **Python**: v3.13+
* **Make**: (Recommended for running scripts via the Makefile)

## Implementation Progress
- [x] Fisher-Yates Shuffle (Group A)
- [x] Pandigital Number Detection (Group A)
- [x] Productivity Tracker (Group B)
- [x] Database Schema (Group B)
- [x] Short Essays

## How to Run

### Setup
```bash
# Install Python dependencies for documentation and automation scripts
pip install openai python-dotenv
```

### Execution
Use the `Makefile` to run the project commands:
```bash
make test          # Runs all unit tests (Node.js)
make docs          # Updates strategy documentation via AI
make push          # Auto-commits and pushes via AI script
make smart-push    # Runs docs update and push sequentially
```

### Verification
To verify the implementation:
1. Run `make test` to execute the comprehensive test suite located in the `test/` directory.
2. Review the `docs/` folder for detailed breakdowns of each challenge section.
3. Check the `submission/` directory for the finalized deliverable previews.
