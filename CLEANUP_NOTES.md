# Cleanup Notes

## Database Files

The following database files are currently locked (servers running):
- `backend/database.db`
- `agent-service/database.db`

These files are in `.gitignore` and won't be committed to Git.

**To remove them:**
1. Stop all DevSync servers
2. Delete the database files manually or run:
   ```bash
   del backend\database.db
   del agent-service\database.db
   ```
3. They will be recreated automatically when you restart DevSync

These are development databases and it's safe to delete them at any time.
