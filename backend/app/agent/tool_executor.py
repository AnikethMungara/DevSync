"""Tool executor for agent function calling"""
from typing import Dict, Any
from app.tools.fs_tools import list_files, read_file, write_file
from app.tools.exec_tools import run_command, run_tests
from app.tools.http_tools import fetch_url
from app.tools.search_tools import search_web
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


# Tool function mapping
TOOL_FUNCTIONS = {
    "list_files": list_files,
    "read_file": read_file,
    "write_file": write_file,
    "run_command": run_command,
    "run_tests": run_tests,
    "fetch_url": fetch_url,
    "search_web": search_web
}


async def execute_tool(tool_name: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a tool function.

    Args:
        tool_name: Name of the tool to execute
        tool_args: Arguments for the tool

    Returns:
        Tool execution result
    """
    try:
        # Check if tool exists
        if tool_name not in TOOL_FUNCTIONS:
            return {"error": f"Unknown tool: {tool_name}"}

        # Check if tool is allowed
        allowed_tools = settings.get_allowed_tools_list()
        tool_allowed = False

        # Map tool names to categories
        tool_categories = {
            "list_files": "fs",
            "read_file": "fs",
            "write_file": "fs",
            "run_command": "exec",
            "run_tests": "exec",
            "fetch_url": "http",
            "search_web": "search"
        }

        tool_category = tool_categories.get(tool_name)
        if tool_category and tool_category in allowed_tools:
            tool_allowed = True

        if not tool_allowed:
            return {"error": f"Tool not allowed: {tool_name}"}

        # Execute tool
        logger.info(f"Executing tool: {tool_name} with args: {tool_args}")
        tool_func = TOOL_FUNCTIONS[tool_name]
        result = await tool_func(**tool_args)

        # Truncate output if too large
        max_chars = settings.AGENT_MAX_OUTPUT_CHARS
        if isinstance(result, dict):
            for key in ['content', 'stdout', 'stderr']:
                if key in result and isinstance(result[key], str):
                    if len(result[key]) > max_chars:
                        result[key] = result[key][:max_chars] + "\n\n[Output truncated]"
                        result['truncated'] = True

        logger.info(f"Tool {tool_name} completed")
        return result

    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {e}", exc_info=True)
        return {"error": f"Tool execution failed: {str(e)}"}
