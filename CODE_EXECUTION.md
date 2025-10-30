# Code Execution Feature

The DevSync application now supports executing JavaScript and Python code directly from the editor.

## Features

- **Run JavaScript and Python code** with a single click or keyboard shortcut
- **Real-time output display** showing stdout, stderr, and exit codes
- **WebSocket broadcasting** of execution results to all connected clients
- **Visual feedback** with success/error indicators
- **Keyboard shortcuts** for quick execution (Ctrl+Enter / Cmd+Enter)

## Usage

### Running Code

1. **Open a file** in the editor (`.js`, `.mjs`, or `.py` file)
2. **Click the "▶ Run" button** in the editor tabs bar, or
3. **Press Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac)

### Viewing Output

After execution:
- The output panel automatically appears below the editor
- View **Standard Output** (stdout) for normal program output
- View **Standard Error** (stderr) for errors and warnings
- Check the **Exit Code** and **Status** (Success/Failed)

### Managing Output

- **Toggle Output Panel**: Click "Show Output" / "Hide Output" button
- **Clear Output**: Click the "✕" button in the output panel header
- **Resize**: The editor resizes to 60% height when output is shown

## API Endpoints

### Execute Code
```http
POST /api/execution/run
Content-Type: application/json

{
  "filePath": "workspace/hello.js",  // Optional
  "code": "console.log('Hello')",    // Optional (alternative to filePath)
  "language": "javascript"            // Required: "javascript" or "python"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "stdout": "Hello\n",
    "stderr": "",
    "exitCode": 0,
    "success": true
  }
}
```

### Get Supported Languages
```http
GET /api/execution/languages
```

**Response:**
```json
{
  "success": true,
  "languages": [
    {
      "id": "javascript",
      "name": "JavaScript",
      "extensions": [".js", ".mjs"],
      "runtime": "Node.js"
    },
    {
      "id": "python",
      "name": "Python",
      "extensions": [".py"],
      "runtime": "Python"
    }
  ]
}
```

## Architecture

### Backend Components

1. **executionController.js** - Handles HTTP requests for code execution
2. **executionService.js** - Core execution logic using `child_process.spawn()`
3. **execution.js** (routes) - API route definitions
4. **WebSocket Support** - Broadcasts execution results to all connected clients

### Frontend Components

1. **Editor.jsx** - Enhanced with:
   - Execution store (Zustand)
   - Run button UI
   - Output panel
   - Keyboard shortcuts
2. **executionApi.js** - API utility functions
3. **index.css** - Styling for execution UI

### Execution Flow

```
User clicks "Run" or presses Ctrl+Enter
    ↓
Frontend sends POST to /api/execution/run
    ↓
Backend executes code via executionService
    ↓
Result returned to frontend + broadcast via WebSocket
    ↓
Output panel displays results
```

## Configuration

### Backend Settings

Located in `backend/config.js`:
- `WORKSPACE_DIR` - Directory where code files are stored
- Execution timeout: 30 seconds (configurable in executionService.js)

### Supported Languages

Currently supported:
- **JavaScript** - Executed via Node.js
- **Python** - Executed via Python interpreter

To add more languages, extend `executionService.js`.

## Security Considerations

1. **Workspace Isolation** - Code execution is limited to the workspace directory
2. **Timeout Protection** - Executions timeout after 30 seconds
3. **Path Validation** - File paths are validated to prevent directory traversal
4. **Sandboxing** - Consider using Docker or VM for production deployments

### Recommended Production Setup

For production environments, consider:
- Running code in isolated Docker containers
- Implementing rate limiting on execution endpoints
- Adding user authentication and authorization
- Monitoring resource usage (CPU, memory)
- Restricting available modules/libraries

## Troubleshooting

### Code Won't Execute

**Check:**
1. Node.js and/or Python are installed and in PATH
2. File extension matches the language (.js for JavaScript, .py for Python)
3. Backend server is running on port 8787
4. No syntax errors in your code

### Output Not Showing

**Check:**
1. WebSocket connection is active
2. Browser console for errors
3. Output panel is toggled on (click "Show Output")

### Permission Errors

**Check:**
1. File is within the workspace directory
2. Backend has read/write permissions on workspace
3. Execution service has proper permissions

## Examples

### JavaScript Example
```javascript
// hello.js
console.log('Hello from JavaScript!');
console.error('This is an error message');

const sum = (a, b) => a + b;
console.log('Sum:', sum(5, 3));
```

### Python Example
```python
# hello.py
print('Hello from Python!')
import sys
print('Python version:', sys.version)

def greet(name):
    return f'Hello, {name}!'

print(greet('DevSync'))
```

## Future Enhancements

Potential improvements:
- [ ] Support for more languages (Go, Rust, TypeScript, etc.)
- [ ] Execution history and saved outputs
- [ ] Input/stdin support for interactive programs
- [ ] Debugging capabilities (breakpoints, step-through)
- [ ] Resource usage monitoring (CPU, memory, time)
- [ ] Code execution templates/snippets
- [ ] Export output to file
- [ ] Collaborative execution viewing in real-time

## Contributing

To add support for a new language:

1. Update `backend/services/executionService.js`:
   ```javascript
   case 'your-language':
     command = 'your-runtime';
     args = [filePath];
     break;
   ```

2. Update `backend/controllers/executionController.js` to add language metadata

3. Update frontend language detection in `Editor.jsx`

4. Test thoroughly with various code samples

---

**Built for DevSync** - A collaborative code editor with real-time execution capabilities.
