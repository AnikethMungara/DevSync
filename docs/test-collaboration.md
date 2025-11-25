# Testing Collaborative Editing

## Quick Test Setup

### Prerequisites
- Backend running on `http://localhost:8787`
- Frontend running on `http://localhost:3000`

### Test Steps

#### User 1 (Host)

1. Open DevSync in browser: `http://localhost:3000`
2. Click the **Users icon** (4th icon) in the activity bar
3. Enter name: "Alice"
4. Click **"Start New Session"**
5. Copy the Session ID (will be shown in the collaboration panel)
6. Share the Session ID with User 2

#### User 2 (Collaborator)

1. Open DevSync in a **new browser window/incognito**: `http://localhost:3000`
2. Click the **Users icon** in the activity bar
3. Enter name: "Bob"
4. Click **"Join Session"**
5. Paste the Session ID from User 1
6. Press Enter

### Verify Connection

Both users should see:
- ✅ Green "Connected" badge with "2 users online"
- ✅ Both user names listed in the Active Users section
- ✅ System message: "Bob joined the session" (for User 1)

### Test Real-Time Editing

1. **User 1**: Open a file from the explorer (or create a new file)
2. **User 2**: Open the same file
3. **User 1**: Start typing
4. **User 2**: Should see the text appear in real-time
5. **User 2**: Start typing in a different area
6. **User 1**: Should see User 2's text appear with their cursor

### Test Features

#### Cursor Presence
- Type in different areas of the file
- Verify you can see the other user's cursor with their name

#### Chat
1. Navigate to Chat section in collaboration sidebar
2. Send a message: "Hello!"
3. Other user should receive it instantly

#### Simultaneous Editing
1. Both users type at the same time in different areas
2. Verify both edits are preserved
3. Verify cursors update correctly

#### Connection Status
- Close one browser tab
- Other user should see: "User left the session"
- Verify user count updates

## Expected Behavior

### ✅ Working Correctly
- Text changes sync within ~100ms
- Cursor positions visible for all users
- Chat messages appear instantly
- User join/leave notifications
- Connection status indicator accurate
- File saves work normally

### ❌ Common Issues

**Issue**: "Failed to connect"
- **Fix**: Ensure backend is running: `cd backend && uvicorn main:app --reload --port 8787`

**Issue**: "Session not found"
- **Fix**: Verify session ID is correct (check for typos)

**Issue**: Edits not syncing
- **Fix**: Both users must have the same file open
- **Fix**: Refresh both browser windows

**Issue**: Cursor in wrong position
- **Fix**: This is expected with textarea (see known limitations)
- **Fix**: Positions are approximate based on line/column

## Testing Different Scenarios

### Scenario 1: Conflict Resolution
1. Both users place cursor at same position
2. Both type different text simultaneously
3. **Expected**: Both texts appear merged, cursors adjust

### Scenario 2: Delete and Insert
1. User 1: Delete a paragraph
2. User 2: (simultaneously) Edit text in that paragraph
3. **Expected**: User 2's cursor moves to deletion point

### Scenario 3: Large Files
1. Open a file with 500+ lines
2. User 1: Edit line 10
3. User 2: Edit line 300
4. **Expected**: Both edits sync correctly, cursors visible

### Scenario 4: Network Interruption
1. Disconnect network for one user (DevTools > Network > Offline)
2. Type while offline
3. Reconnect
4. **Expected**: Automatic reconnection (up to 5 attempts)
5. **Note**: Offline edits may conflict and need manual resolution

## Performance Testing

### Load Test: Multiple Users
- Test with 2, 3, 5 users
- Monitor latency
- Check CPU/memory usage

### Load Test: Rapid Typing
- Paste large text blocks
- Type very quickly
- **Expected**: No lost characters, smooth sync

## Debugging

### Frontend Console
```javascript
// Check WebSocket connection
console.log(wsRef.current?.readyState)
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

// View session state
useCollaborationStore.getState()
```

### Backend Logs
```bash
# Run backend with debug logging
cd backend
uvicorn main:app --reload --port 8787 --log-level debug
```

### WebSocket Messages
Open browser DevTools:
1. Network tab
2. Filter: WS (WebSocket)
3. Click on the WebSocket connection
4. View Messages tab
5. Observe real-time message flow

## Success Criteria

✅ All features working:
- [ ] Real-time text synchronization
- [ ] Cursor presence for all users
- [ ] Chat messaging
- [ ] User join/leave notifications
- [ ] Automatic reconnection
- [ ] Connection status indicator
- [ ] Session creation and joining
- [ ] Multiple concurrent edits

✅ Performance acceptable:
- [ ] Sync latency < 200ms
- [ ] No lost edits
- [ ] Smooth typing experience
- [ ] Stable connection

✅ Error handling:
- [ ] Graceful disconnection
- [ ] Reconnection attempts
- [ ] Error messages displayed

## Next Steps

After successful testing:

1. **Production Readiness**
   - Add authentication
   - Implement rate limiting
   - Add session persistence
   - Deploy with WSS (secure WebSocket)

2. **UX Improvements**
   - Integrate Monaco/CodeMirror editor
   - Add selection highlighting
   - Improve cursor positioning accuracy
   - Add typing indicators

3. **Advanced Features**
   - File locking
   - Version history with collaboration data
   - Presence awareness (viewing vs. editing)
   - Voice/video chat integration
