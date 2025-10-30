import type { FsNode, FileContent } from "@/lib/types"

// Mock file system data
const mockFileSystem: FsNode = {
  id: "root",
  name: "devsync-project",
  type: "folder",
  path: "/",
  children: [
    {
      id: "src",
      name: "src",
      type: "folder",
      path: "/src",
      children: [
        {
          id: "components",
          name: "components",
          type: "folder",
          path: "/src/components",
          children: [
            { id: "app-tsx", name: "App.tsx", type: "file", path: "/src/components/App.tsx" },
            { id: "header-tsx", name: "Header.tsx", type: "file", path: "/src/components/Header.tsx" },
          ],
        },
        {
          id: "lib",
          name: "lib",
          type: "folder",
          path: "/src/lib",
          children: [
            { id: "utils-ts", name: "utils.ts", type: "file", path: "/src/lib/utils.ts" },
            { id: "api-ts", name: "api.ts", type: "file", path: "/src/lib/api.ts" },
          ],
        },
        { id: "index-tsx", name: "index.tsx", type: "file", path: "/src/index.tsx" },
      ],
    },
    {
      id: "public",
      name: "public",
      type: "folder",
      path: "/public",
      children: [{ id: "favicon-ico", name: "favicon.ico", type: "file", path: "/public/favicon.ico" }],
    },
    { id: "package-json", name: "package.json", type: "file", path: "/package.json" },
    { id: "tsconfig-json", name: "tsconfig.json", type: "file", path: "/tsconfig.json" },
    { id: "readme-md", name: "README.md", type: "file", path: "/README.md" },
  ],
}

const mockFileContents: Record<string, string> = {
  "/src/components/App.tsx": `import React from 'react';
import { Header } from './Header';

export function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <h1>Welcome to DevSync</h1>
      </main>
    </div>
  );
}`,
  "/src/components/Header.tsx": `import React from 'react';

export function Header() {
  return (
    <header className="header">
      <h1>DevSync IDE</h1>
    </header>
  );
}`,
  "/src/lib/utils.ts": `export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date) {
  return date.toLocaleDateString();
}`,
  "/README.md": `# DevSync

A collaborative developer workspace inspired by Cursor IDE.

## Features

- File explorer
- Code editor
- AI assistant
- Command palette`,
}

export async function getFileSystem(): Promise<FsNode> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  return mockFileSystem
}

export async function getFileContent(path: string): Promise<FileContent> {
  await new Promise((resolve) => setTimeout(resolve, 50))

  const content = mockFileContents[path] || `// File: ${path}\n\n// Content not available`
  const language =
    path.endsWith(".tsx") || path.endsWith(".ts") ? "typescript" : path.endsWith(".md") ? "markdown" : "plaintext"

  return {
    path,
    content,
    language,
    updatedAt: new Date().toISOString(),
  }
}
