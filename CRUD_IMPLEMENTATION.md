# File Explorer CRUD Implementation

## Overview
This implementation adds full CRUD (Create, Read, Update, Delete) functionality to the file explorer in DevSync without requiring hardcoded "projects". Files are managed directly in the workspace directory with automatic database synchronization.

## Backend Changes

### 1. Database Schema Updates
**File**: `backend/services/databaseService.js`

- Modified `files` table to make `project_id` optional (nullable)
- Changed path to be globally unique instead of per-project
- Added `updatePath` query for rename operations
- Added `findAll` query to get all files

```sql
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  path TEXT NOT NULL UNIQUE,
  content TEXT,
  size INTEGER DEFAULT 0,
  last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
)
```

### 2. New API Endpoints
**File**: `backend/routes/files.js`

- `GET /api/files/tree` - Get complete file tree structure
- `PATCH /api/files/rename` - Rename/move files and folders
- Existing endpoints:
  - `GET /api/files?path=<path>` - Read file content
  - `POST /api/files` - Create file or directory
  - `PUT /api/files` - Update file content
  - `DELETE /api/files?path=<path>` - Delete file or directory

### 3. File Service Updates
**File**: `backend/services/fileService.js`

Added new functions:
- `getFileTree(relativePath)` - Builds hierarchical file tree
- `renameFile(oldPath, newPath)` - Atomic rename/move operation
- Database synchronization in all operations:
  - `createFile()` - Syncs to DB after file creation
  - `updateFile()` - Updates DB with new content
  - `deleteFile()` - Removes from DB when deleted
  - `renameFile()` - Updates path in DB

Features:
- Automatic workspace directory creation
- Sorts folders first, then alphabetically
- Filters out hidden files (starting with `.`)
- Recursive tree building

### 4. Controller Updates
**File**: `backend/controllers/filesController.js`

Added:
- `getFileTree()` - Handler for file tree endpoint
- `renameFile()` - Handler for rename operation

## Frontend Changes

### 1. API Layer Updates
**File**: `frontend/lib/api/files.tsx`

- Updated `getFileSystem()` to call `/api/files/tree` endpoint
- Updated `renameFile()` to use `PATCH /api/files/rename`
- All CRUD operations now call real backend APIs:
  - `createFile(path, content, isDirectory)`
  - `updateFile(path, content)`
  - `deleteFile(path)`
  - `renameFile(oldPath, newPath)`

### 2. Explorer Store Updates
**File**: `frontend/features/explorer/use-explorer.ts`

Added:
- `refreshFileSystem()` - Fetches latest file tree from backend
- Imports `getFileSystem` from API layer

### 3. ProjectExplorer Component
**File**: `frontend/components/layout/project-explorer.tsx`

Major enhancements:
- **Context Menu** - Right-click on any file/folder for options
- **CRUD Operations**:
  - Create new files (root level via + button or context menu in folders)
  - Create new folders (context menu in folders)
  - Rename files/folders (context menu)
  - Delete files/folders (context menu with confirmation)
- **Dialogs** - Modal dialogs for all operations with validation
- **Refresh Button** - Manual refresh of file tree
- **Toast Notifications** - Success/error feedback for all operations
- **Real-time Updates** - Automatically refreshes tree after operations

## How It Works

### File Creation Flow
1. User clicks "+" button or right-clicks folder → "New File"
2. Dialog opens for file name input
3. Frontend calls `createFile(path, content, isDirectory)`
4. Backend:
   - Creates file in `workspace/` directory
   - Inserts metadata to `files` table in SQLite
5. Frontend refreshes file tree
6. Toast notification confirms success

### File Read Flow
1. User clicks on a file in explorer
2. Frontend calls `getFileContent(path)`
3. Backend reads file from disk
4. Content returned to editor

### File Update Flow
1. User edits file in editor and saves
2. Frontend calls `updateFile(path, content)`
3. Backend:
   - Writes to disk with debounce (250ms)
   - Updates `files` table with new content and size
4. Toast notification confirms save

### File Delete Flow
1. User right-clicks → Delete
2. Confirmation dialog appears
3. Frontend calls `deleteFile(path)`
4. Backend:
   - Deletes from filesystem (recursive for folders)
   - Removes from `files` table
5. Frontend refreshes file tree
6. Toast notification confirms deletion

### File Rename Flow
1. User right-clicks → Rename
2. Dialog with current name appears
3. User enters new name
4. Frontend calls `renameFile(oldPath, newPath)`
5. Backend:
   - Performs atomic rename on disk
   - Updates path in `files` table
6. Frontend refreshes file tree
7. Toast notification confirms rename

## File Tree Structure

The backend returns a hierarchical structure:

```typescript
interface FsNode {
  id: string           // Unique identifier (path or 'root')
  name: string         // Display name
  path: string         // Full relative path
  type: 'folder' | 'file'
  children?: FsNode[]  // Only for folders
  size?: number        // Only for files
}
```

Example:
```json
{
  "id": "root",
  "name": "workspace",
  "path": "",
  "type": "folder",
  "children": [
    {
      "id": "src",
      "name": "src",
      "path": "src",
      "type": "folder",
      "children": [
        {
          "id": "src/index.ts",
          "name": "index.ts",
          "path": "src/index.ts",
          "type": "file",
          "size": 1234
        }
      ]
    }
  ]
}
```

## Key Features

1. **No Hardcoded Projects**: Works directly with workspace directory
2. **Database Persistence**: All file operations synced to SQLite
3. **Flexible Architecture**: Can add project support later without breaking changes
4. **Context Menus**: Right-click anywhere for relevant actions
5. **User Feedback**: Toast notifications for all operations
6. **Error Handling**: Proper error messages and logging
7. **Validation**: File name validation and confirmation dialogs
8. **Atomic Operations**: Rename uses atomic fs.rename
9. **Recursive Operations**: Folder deletion handles nested files
10. **Auto-refresh**: File tree updates after every operation

## Testing the Implementation

### Start Backend
```bash
cd backend
npm run dev
```
Server runs on http://localhost:8787

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000 (Next.js) or http://localhost:5173 (Vite)

### Test Operations

1. **Create File**: Click + button → enter "test.js" → see file appear
2. **Create Folder**: Right-click root → New Folder → enter "src" → folder appears
3. **Nested File**: Right-click "src" → New File → enter "index.ts" → file appears in folder
4. **Rename**: Right-click file → Rename → change name → file updates
5. **Delete**: Right-click file → Delete → confirm → file disappears
6. **Refresh**: Click refresh icon → tree reloads from server

### Verify Database Persistence
```bash
cd backend
sqlite3 data/devsync.db
> SELECT * FROM files;
```

You should see all created files with their paths and metadata.

## Future Enhancements

- [ ] Search functionality (filter files in tree)
- [ ] Drag-and-drop to move files
- [ ] File upload/download
- [ ] Multi-select operations
- [ ] File preview on hover
- [ ] Recent files list
- [ ] Keyboard shortcuts (Ctrl+N, Delete, F2, etc.)
- [ ] File type icons based on extension
- [ ] Git status indicators
- [ ] Optional project organization
