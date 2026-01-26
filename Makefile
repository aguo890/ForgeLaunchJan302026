PYTHON_CMD ?= python
NODE_CMD ?= node


# Argument handler for 'branch'
ifeq (branch,$(firstword $(MAKECMDGOALS)))
  BRANCH_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  # This prevents Make from trying to treat the argument as a target
  $(eval $(BRANCH_ARGS):;@:)
endif

.PHONY: push branch test docs smart-push

# Update documentation using AI
docs:
	@echo "📚 Updating documentation..."
	@$(PYTHON_CMD) scripts/update_docs.py

# Push to GitHub (Auto-commit with AI)
push:
	@echo "🚀 Running push..."
	@$(PYTHON_CMD) scripts/autocommit.py

# Update docs and then push
smart-push: docs push
# Create a new branch
branch:
	@if "$(BRANCH_ARGS)"=="" (echo "⚠️  Usage: make branch <name>" & exit /b 1)
	@echo "🌿 Creating branch: $(BRANCH_ARGS)"
	@git checkout -b $(BRANCH_ARGS)
	@git push --set-upstream origin $(BRANCH_ARGS)

# Run all tests
test:
	@echo "🧪 Running all tests..."
	@$(NODE_CMD) --test test/*.test.js
