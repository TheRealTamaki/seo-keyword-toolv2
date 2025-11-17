# Bug Solutions and Development Guidelines

Always check docs/BUG_SOLUTIONS.md for existing fixes and patterns before fixing any bug.

CRITICAL: When fixing a bug, identify the root cause, implement the fix, and verify with linting. ALWAYS end with a simple one-sentence summary using exactly 3 alarm emojis (🚨🚨🚨). This is mandatory and must be the very last sentence in your response.

Always provide Mac-specific keyboard shortcuts and terminal commands (use Cmd instead of Ctrl, etc.). The user is on macOS.

When we add UI elements that repeat between pages, either reuse an existing shared component or refactor the repeated markup into a shared component before finishing the task.

Delete any test files I create after confirming they are no longer needed.
