"""Tool schemas for agent function calling"""
from app.agent.types import ToolSpec


# System prompt for the agent
AGENT_SYSTEM_PROMPT = """You are the Dev IDE Agent. Goals:
1) Be precise, terse, and cite which tools you used.
2) Before writing files, list the plan and the paths you will touch.
3) Prefer minimal diffs over full rewrites.
4) NEVER exfiltrate secrets. NEVER write outside WORKSPACE_ROOT.
5) When running commands, estimate time & show a cancel option.
6) If a tool fails, summarize error and propose a fallback.
7) Obey model and tool allowlists passed in the session config."""


# File system tools
LIST_FILES_TOOL = ToolSpec(
    name="list_files",
    description="List files and directories in a given path within the workspace",
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Relative path from workspace root to list (default: root)"
            },
            "max_depth": {
                "type": "integer",
                "description": "Maximum depth to traverse (default: 2)",
                "default": 2
            }
        },
        "required": []
    }
)

READ_FILE_TOOL = ToolSpec(
    name="read_file",
    description="Read contents of a file within the workspace",
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Relative path from workspace root to the file"
            },
            "max_bytes": {
                "type": "integer",
                "description": "Maximum bytes to read (default: 200000)",
                "default": 200000
            }
        },
        "required": ["path"]
    }
)

WRITE_FILE_TOOL = ToolSpec(
    name="write_file",
    description="Write content to a file within the workspace",
    parameters={
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Relative path from workspace root to the file"
            },
            "content": {
                "type": "string",
                "description": "Content to write to the file"
            },
            "create": {
                "type": "boolean",
                "description": "Create file if it doesn't exist (default: true)",
                "default": True
            },
            "overwrite": {
                "type": "boolean",
                "description": "Overwrite file if it exists (default: true)",
                "default": True
            }
        },
        "required": ["path", "content"]
    }
)

# Execution tools
RUN_COMMAND_TOOL = ToolSpec(
    name="run_command",
    description="Run a shell command within the workspace sandbox",
    parameters={
        "type": "object",
        "properties": {
            "cmd": {
                "type": "string",
                "description": "Command to execute"
            },
            "args": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Command arguments",
                "default": []
            },
            "cwd": {
                "type": "string",
                "description": "Working directory relative to workspace root",
                "default": "."
            },
            "timeout_sec": {
                "type": "integer",
                "description": "Timeout in seconds",
                "default": 30
            }
        },
        "required": ["cmd"]
    }
)

RUN_TESTS_TOOL = ToolSpec(
    name="run_tests",
    description="Run test command in the workspace",
    parameters={
        "type": "object",
        "properties": {
            "command": {
                "type": "string",
                "description": "Test command to run (e.g., 'pytest', 'npm test')"
            }
        },
        "required": ["command"]
    }
)

# HTTP tools
FETCH_URL_TOOL = ToolSpec(
    name="fetch_url",
    description="Fetch content from a URL",
    parameters={
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "URL to fetch"
            },
            "method": {
                "type": "string",
                "description": "HTTP method (default: GET)",
                "enum": ["GET", "POST", "PUT", "DELETE"],
                "default": "GET"
            },
            "headers": {
                "type": "object",
                "description": "HTTP headers",
                "default": {}
            },
            "max_bytes": {
                "type": "integer",
                "description": "Maximum bytes to read (default: 200000)",
                "default": 200000
            }
        },
        "required": ["url"]
    }
)

# Search tools
SEARCH_WEB_TOOL = ToolSpec(
    name="search_web",
    description="Search the web (if search service is configured)",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query"
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of results (default: 5)",
                "default": 5
            }
        },
        "required": ["query"]
    }
)


# Tool registry mapping
TOOL_REGISTRY = {
    "fs": [LIST_FILES_TOOL, READ_FILE_TOOL, WRITE_FILE_TOOL],
    "exec": [RUN_COMMAND_TOOL, RUN_TESTS_TOOL],
    "http": [FETCH_URL_TOOL],
    "search": [SEARCH_WEB_TOOL]
}


def get_tools_for_categories(categories: list[str]) -> list[ToolSpec]:
    """Get tool specs for given categories"""
    tools = []
    for category in categories:
        if category in TOOL_REGISTRY:
            tools.extend(TOOL_REGISTRY[category])
    return tools
