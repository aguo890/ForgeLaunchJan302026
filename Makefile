PYTHON_CMD ?= python

# Argument handler for 'branch'
ifeq (branch,$(firstword $(MAKECMDGOALS)))
  BRANCH_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
  # This prevents Make from trying to treat the argument as a target
  $(eval $(BRANCH_ARGS):;@:)
endif

.PHONY: push branch
# Push to GitHub (Auto-commit with AI)
push:
	@echo "🚀 Running smart push..."
	@$(PYTHON_CMD) scripts/autocommit.py
# Create a new branch
branch:
	@if "$(BRANCH_ARGS)"=="" (echo "⚠️  Usage: make branch <name>" & exit /b 1)
	@echo "🌿 Creating branch: $(BRANCH_ARGS)"
	@git checkout -b $(BRANCH_ARGS)
	@git push --set-upstream origin $(BRANCH_ARGS)
