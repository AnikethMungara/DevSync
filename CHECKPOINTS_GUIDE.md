# Checkpoints Guide

## What are Checkpoints?

Checkpoints are **snapshots** of your entire project at a specific point in time. Think of them as "save points" in a video game - you can create a checkpoint before making risky changes, and if something goes wrong, you can instantly revert back to that saved state.

## Key Features

✅ **Quick Snapshots** - Save your entire project in seconds
✅ **Easy Revert** - Restore your project to any checkpoint with one click
✅ **Automatic Cleanup** - Only keeps the last 3 checkpoints (oldest auto-deleted)
✅ **Smart Exclusions** - Skips dependencies, build files, and sensitive data
✅ **Size Tracking** - Shows file count and storage size for each checkpoint

## How to Use Checkpoints

### 1. Creating a Checkpoint

1. **Open the Checkpoints panel**
   - Click the **"Checkpoints"** tab in the bottom panel

2. **Click "Create Checkpoint"**

3. **Fill in the details**:
   - **Name** (required): Short name like "Before refactoring" or "Working version"
   - **Description** (optional): More details about what this checkpoint contains

4. **Click "Create"**
   - The IDE will save a snapshot of all your project files
   - You'll see the new checkpoint appear in the list

### 2. Viewing Checkpoints

In the Checkpoints panel, you'll see:

- **Checkpoint Name** - The name you gave it
- **Description** - Optional description text
- **Time Created** - How long ago (e.g., "2h ago", "yesterday")
- **File Count** - Number of files saved
- **Size** - Total size of the checkpoint

Checkpoints are sorted with **newest first**.

### 3. Reverting to a Checkpoint

⚠️ **Warning**: Reverting replaces ALL files in your workspace with the checkpoint version. Unsaved changes will be lost!

1. **Find the checkpoint** you want to restore

2. **Click "Revert"** button

3. **Confirm** the action in the dialog

4. **Wait** for the restore process

5. **Page reloads** automatically to show restored files

### 4. Deleting a Checkpoint

1. **Find the checkpoint** you want to delete

2. **Click the trash icon** (🗑️)

3. **Confirm** the deletion

4. The checkpoint is permanently removed

## When to Create Checkpoints

### ✅ Good Times to Create Checkpoints

- **Before refactoring** - Save a working version before major code changes
- **Before upgrading dependencies** - In case the upgrade breaks something
- **After completing a feature** - Save a working milestone
- **Before trying experimental code** - Easy rollback if it doesn't work
- **End of day** - Save your progress before leaving

### ❌ Don't Create Checkpoints

- **Every 5 minutes** - You only get 3 checkpoints total
- **For tiny changes** - Use Git commits for granular history instead
- **When broken code** - Only checkpoint working versions

## What Gets Saved?

### ✅ Included in Checkpoints

- All source code files (.js, .ts, .py, etc.)
- Configuration files (package.json, etc.)
- Documentation files (.md, .txt)
- Assets (images, styles, etc.)
- Custom files and folders

### ❌ Excluded from Checkpoints

- `.checkpoints/` - The checkpoints folder itself
- `.git/` - Git history (use Git for this)
- `node_modules/` - Node dependencies
- `venv/`, `.venv/` - Python virtual environments
- `__pycache__/` - Python cache files
- `.env`, `.env.local` - Environment variables
- `*.db`, `*.sqlite` - Database files
- `*.log` - Log files
- Build outputs - `build/`, `dist/`, `.next/`

## Checkpoint Limits

- **Maximum Checkpoints**: 3
- **Auto-Deletion**: When you create a 4th checkpoint, the oldest one is automatically deleted
- **Storage**: Checkpoints are stored in `.checkpoints/` folder (excluded from Git)

### Why Only 3 Checkpoints?

Checkpoints save your entire project, which can use significant disk space. Keeping only 3 ensures:
- Enough history for common use cases
- Reasonable disk space usage
- Fast backup/restore operations

For longer-term versioning, use Git commits.

## Example Workflow

### Scenario: Major Refactoring

```
1. Everything works ✅
   → Create checkpoint: "Before refactoring getUserData"

2. Start refactoring...
   → Make changes to 15 files

3. Tests start failing ❌
   → Something broke, but not sure what

4. Click "Revert" on the checkpoint
   → All 15 files restored to working state
   → Back to step 1 ✅

5. Try refactoring again with better approach
```

### Scenario: Trying New Library

```
1. Project using Library A ✅
   → Create checkpoint: "Before switching to Library B"

2. Install Library B
   → npm install library-b

3. Update code to use Library B
   → Make changes across multiple files

4. Library B has bugs ❌
   → Decide to stick with Library A

5. Revert to checkpoint
   → All code reverted
   → Library B still in node_modules but not used
   → npm uninstall library-b

6. Back to working with Library A ✅
```

## Tips & Best Practices

### 1. Use Descriptive Names

**Good names:**
- "Working version before API refactor"
- "Stable - all tests passing"
- "Before upgrading React to v19"

**Bad names:**
- "checkpoint 1"
- "test"
- "asdf"

### 2. Add Context in Descriptions

Include information that helps you decide whether to revert:
- What was working: "All features functional, 95% test coverage"
- What you're about to do: "About to refactor auth system"
- Any warnings: "Database migration not included"

### 3. Create Before Risky Changes

Always checkpoint before:
- Major refactoring
- Dependency upgrades
- Architectural changes
- Trying unfamiliar libraries
- Experimental features

### 4. Don't Rely on Checkpoints Alone

Checkpoints are for **short-term** safety nets:
- Use **Git** for permanent version history
- Use **Checkpoints** for quick rollback during development
- Commit to Git after validating checkpoint changes

### 5. Check What You're Reverting To

Before clicking "Revert":
- Read the checkpoint description
- Check the creation time
- Verify it's the version you want
- Remember: ALL current changes will be lost

## Checkpoints vs Git

| Feature | Checkpoints | Git |
|---------|-------------|-----|
| **Speed** | ⚡ Instant | Slower (requires commit, push) |
| **History** | Last 3 only | Unlimited |
| **Granularity** | Full project snapshot | File-level, line-level |
| **Collaboration** | ❌ Local only | ✅ Team sharing |
| **Best For** | Quick rollback | Permanent history |
| **Storage** | `.checkpoints/` folder | `.git/` folder |

**Use Both:**
- **Checkpoints**: Quick safety net during active development
- **Git**: Permanent version control and collaboration

## Troubleshooting

### Checkpoint Creation Failed

**Symptoms**: Error message when creating checkpoint

**Solutions**:
1. Check disk space - need enough room for project copy
2. Verify write permissions in project folder
3. Check backend server is running (port 8787)
4. Look for locked files (databases, running processes)

### Revert Not Working

**Symptoms**: Files don't change after reverting

**Solutions**:
1. Refresh the page manually if it didn't auto-reload
2. Check backend logs for errors
3. Verify checkpoint exists in Checkpoints panel
4. Try creating a new checkpoint first, then reverting

### Checkpoint List Empty

**Symptoms**: No checkpoints shown in panel

**Solutions**:
1. Create your first checkpoint (you haven't made any yet)
2. Check backend server is running
3. Look in `.checkpoints/` folder to verify they exist
4. Check browser console for API errors

### Checkpoint Too Large

**Symptoms**: Checkpoint takes long time or fails

**Solutions**:
1. Check if large files are in your project
2. Delete unnecessary files before checkpointing
3. Excluded folders should be automatically skipped
4. Consider cleaning `node_modules` if it wasn't excluded

## Security & Privacy

### What's Safe

✅ Checkpoints are stored **locally only**
✅ `.checkpoints/` folder is in `.gitignore` (not committed to Git)
✅ `.env` files are automatically excluded
✅ API keys in excluded files are NOT saved

### What to Check

⚠️ Hardcoded secrets in source code ARE saved
⚠️ Sensitive data in regular files IS included
⚠️ Checkpoints are not encrypted

**Best Practice**: Never hardcode secrets in source code. Always use `.env` files.

## Technical Details

### Storage Location

```
YourProject/
├── .checkpoints/           # Checkpoints folder
│   ├── .gitignore         # Excludes from Git
│   ├── 20250107_143022/   # Checkpoint ID (timestamp)
│   │   ├── metadata.json  # Checkpoint info
│   │   └── data/          # Snapshot files
│   ├── 20250107_151530/
│   └── 20250107_160045/
```

### Metadata Format

Each checkpoint has a `metadata.json` file:

```json
{
  "id": "20250107_143022",
  "name": "Before refactoring",
  "description": "Working version with all tests passing",
  "created_at": "2025-01-07T14:30:22.123456",
  "file_count": 145,
  "size_bytes": 2456789
}
```

### API Endpoints

- `POST /api/checkpoints/create` - Create checkpoint
- `GET /api/checkpoints/list` - List all checkpoints
- `GET /api/checkpoints/{id}` - Get checkpoint details
- `POST /api/checkpoints/{id}/revert` - Revert to checkpoint
- `DELETE /api/checkpoints/{id}` - Delete checkpoint

## FAQ

**Q: Can I have more than 3 checkpoints?**
A: Currently limited to 3. This is configurable in the backend code if you need more.

**Q: Are checkpoints backed up?**
A: No, they're local only. Use Git for backups and sharing.

**Q: Can teammates access my checkpoints?**
A: No, checkpoints are local to your machine. Each developer has their own.

**Q: What happens if I delete `.checkpoints/` folder?**
A: All checkpoints are permanently lost. The folder will be recreated when you make a new checkpoint.

**Q: Can I checkpoint while code is running?**
A: Yes, but running processes won't be saved. Only files are checkpointed.

**Q: Do checkpoints include Git history?**
A: No, `.git/` folder is excluded. Use Git for version history.

**Q: Can I rename a checkpoint?**
A: Not currently. You'd need to delete and create a new one.

**Q: How much disk space do checkpoints use?**
A: Depends on project size. Each checkpoint is a full copy (minus exclusions). A typical web project might be 10-50 MB per checkpoint.

---

**Need help?** Check [QUICK_START.md](QUICK_START.md) or open an issue on GitHub.
