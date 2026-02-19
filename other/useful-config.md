# Useful Codex Configuration

You typically place this file at `~/.codex/config.toml` (for global user settings) or `.codex/config.toml` (inside a specific project to override settings just for that repo).

## Core Model Settings

Control intelligence, cost, and speed.

```toml
# The default model to use.
# Options: "gpt-5.2-codex" (Standard), "gpt-5.3-codex" (Newest), "gpt-5.1-codex-mini" (Cheaper/Faster)
model = "gpt-5.2-codex"

# How hard the model thinks before answering (for models that support reasoning).
# Options: "low", "medium" (default), "high", "xhigh"
# Use "high" for complex refactors, "low" for quick syntax questions.
model_reasoning_effort = "medium"

# The communication style of the assistant.
# Options: "friendly" (default), "pragmatic" (concise, less chatty), "none"
personality = "pragmatic"
```

## Permissions & Safety (Critical)

Control what the agent is allowed to do without asking you.

```toml
# When to pause and ask you for permission before running a command or editing a file.
# Options:
# - "on-request": (Default) The agent decides when to ask (balanced).
# - "never":      (Risky) Runs everything automatically. Good for autonomous "codex exec" scripts.
# - "untrusted":  Strict. Asks for almost everything.
approval_policy = "on-request"

# Controls file system and network access.
# Options:
# - "read-only":       Agent can look but cannot touch.
# - "workspace-write": (Default) Can edit files inside the repo, but blocked from system files (e.g. /etc).
# - "danger-full-access": No sandbox. Agent can edit system files and access the internet freely.
sandbox_mode = "workspace-write"

# Web search behavior.
# Options:
# - "cached": (Default) Safer. Uses OpenAI's pre-indexed copy of the web (prevents prompt injection).
# - "live":   Fetches real-time data. Use this if you need docs for a library released yesterday.
# - "disabled": No web access.
web_search = "cached"
```

## Environment & Integration

Make Codex play nicely with your tools and shell.

```toml
# How citations (file links) in the chat response should open.
# Options: "vscode", "cursor", "windsurf", "vscode-insiders", "none"
file_opener = "vscode"

# Controls which environment variables are passed to the agent's shell.
# By default, Codex scrubs secrets to prevent leaks.
[shell_environment_policy]
# inherit = "all" # Default: Pass everything except known secrets.
# Or use this to be strict and only pass specific variables:
# include_only = ["PATH", "HOME", "TERM"]
```

## Privacy & Telemetry

```toml
# Disable anonymous usage statistics sent to OpenAI.
[analytics]
enabled = false

# Disable the "/feedback" command and prompts.
[feedback]
enabled = false
```

## Useful Features

Toggle experimental or optional capabilities.

```toml
[features]
# Speed up repeated commands by snapshotting the shell state (Beta).
shell_snapshot = true

# Enable "Plan Mode" to let the agent propose a strategy before coding (Stable).
collaboration_modes = true
```

## Profiles (Advanced)

Switch between these using `codex --profile <name>`.

```toml
# A profile for cheap, fast fixes.
[profiles.fast]
model = "gpt-5.1-codex-mini"
web_search = "disabled"
approval_policy = "never"

# A profile for deep architectural work.
[profiles.deep]
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
sandbox_mode = "read-only" # Safety first when thinking deeply
```

## Model Context Protocol (MCP)

Connect external tools (databases, Linear, Slack, etc.).

```toml
# Example: Connect to a local documentation server
# [mcp_servers.docs]
# command = "npx"
# args = ["-y", "@modelcontextprotocol/server-docs"]
# enabled = true
```

## Key Takeaways

1. **Safety vs. Autonomy:** The most common tweak is `approval_policy`. Setting it to `"never"` unlocks true "Agentic" behavior where it fixes bugs while you get coffee, but carries the risk of it deleting the wrong file.
2. **Cost Control:** Switching `model` to `"gpt-5.1-codex-mini"` is the best way to save credits/money for simple tasks.
3. **Context:** The `web_search = "live"` setting is crucial if you are working with very new frameworks (released in the last month) that aren't in the training data or search cache yet.
