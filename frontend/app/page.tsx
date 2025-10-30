export default function Page() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1e1e1e",
        color: "#cccccc",
        padding: "48px 24px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", marginBottom: "24px", color: "#007acc" }}>Collaborative Code Editor</h1>

        <div
          style={{
            background: "#252526",
            border: "1px solid #3e3e42",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "#4ec9b0" }}>
            ⚠️ This is a Vite + React Application
          </h2>
          <p style={{ lineHeight: "1.6", marginBottom: "16px" }}>
            This project was built according to your specification as a <strong>Vite + React</strong> application, not
            Next.js. It cannot run in the v0 preview environment.
          </p>
        </div>

        <div
          style={{
            background: "#252526",
            border: "1px solid #3e3e42",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>📦 Installation Steps</h2>

          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#dcdcaa" }}>Option 1: Download ZIP</h3>
            <ol style={{ lineHeight: "1.8", paddingLeft: "24px" }}>
              <li>Click the three dots (⋯) in the top right corner</li>
              <li>Select "Download ZIP"</li>
              <li>Extract the ZIP file</li>
              <li>
                Navigate to the{" "}
                <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>frontend/</code>{" "}
                directory
              </li>
              <li>
                Run: <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>npm install</code>
              </li>
              <li>
                Create a <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>.env</code>{" "}
                file (see below)
              </li>
              <li>
                Run: <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>npm run dev</code>
              </li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#dcdcaa" }}>Option 2: Push to GitHub</h3>
            <ol style={{ lineHeight: "1.8", paddingLeft: "24px" }}>
              <li>Click the GitHub icon in the top right corner</li>
              <li>Push the code to your repository</li>
              <li>Clone the repository locally</li>
              <li>Follow steps 4-7 from Option 1</li>
            </ol>
          </div>
        </div>

        <div
          style={{
            background: "#252526",
            border: "1px solid #3e3e42",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>🔧 Environment Variables</h2>
          <p style={{ marginBottom: "12px" }}>
            Create a <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>.env</code> file
            in the <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>frontend/</code>{" "}
            directory:
          </p>
          <pre
            style={{
              background: "#1e1e1e",
              padding: "16px",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "14px",
              fontFamily: "Consolas, Monaco, monospace",
            }}
          >
            {`VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787/ws
VITE_TERMINAL_ENABLED=true
VITE_EXTENSIONS_ENABLED=true`}
          </pre>
        </div>

        <div
          style={{
            background: "#252526",
            border: "1px solid #3e3e42",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>🚀 Features Included</h2>
          <ul style={{ lineHeight: "1.8", paddingLeft: "24px" }}>
            <li>
              <strong>Monaco Editor</strong> - Multi-tab editing with format on save
            </li>
            <li>
              <strong>Real-time Collaboration</strong> - Yjs-powered co-editing with presence cursors
            </li>
            <li>
              <strong>Terminal Panel</strong> - xterm.js with WebSocket PTY support
            </li>
            <li>
              <strong>File Tree</strong> - CRUD operations on project files
            </li>
            <li>
              <strong>Extensions System</strong> - Right-pane view contributions
            </li>
            <li>
              <strong>Dark Theme</strong> - Default dark mode with persistence
            </li>
            <li>
              <strong>Command Palette</strong> - Ctrl/Cmd+K for quick actions
            </li>
            <li>
              <strong>Problems Panel</strong> - Basic diagnostics (trailing whitespace)
            </li>
          </ul>
        </div>

        <div
          style={{
            background: "#2d2d30",
            border: "1px solid #dcdcaa",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "#dcdcaa" }}>⚠️ Backend Required</h2>
          <p style={{ lineHeight: "1.6", marginBottom: "12px" }}>
            This frontend application requires a backend server that implements the API contract specified in the
            README.
          </p>
          <p style={{ lineHeight: "1.6" }}>
            The backend must provide REST endpoints for file operations and a WebSocket server for real-time
            collaboration. See{" "}
            <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>frontend/README.md</code>{" "}
            for the complete API specification.
          </p>
        </div>

        <div style={{ marginTop: "48px", textAlign: "center", color: "#969696" }}>
          <p>Built with Vite + React + Monaco + Yjs</p>
        </div>
      </div>
    </div>
  )
}
