# DevSync Real-Time Collaboration

DevSync now supports real-time multi-user collaboration, allowing multiple developers to work together on the same codebase simultaneously.

## Features

### 🚀 Real-Time Collaboration
- **Live Presence**: See who's online and actively editing
- **Cursor Sharing**: View other users' cursor positions in real-time
- **Text Selection**: See what code other users are selecting
- **Document Sync**: Real-time synchronization of file edits
- **Chat System**: Built-in chat for team communication

## How to Use

### Starting a New Collaboration Session

1. Click the **Users** icon in the activity bar (left sidebar)
2. Enter your name
3. Click **"Start New Session"**
4. Share the Session ID with your teammates

### Joining an Existing Session

1. Click the **Users** icon in the activity bar
2. Enter your name
3. Click **"Join Session"**
4. Paste the Session ID shared by your teammate
5. Click **Join**

### Collaborating

Once connected:

- **See Active Users**: View all connected users with their names and colors
- **Track Cursors**: See where each user is editing (cursors are color-coded)
- **Chat**: Use the built-in chat to communicate with teammates
- **Real-time Edits**: All file changes are synchronized automatically

### Leaving a Session

Click the **"Leave Session"** button in the collaboration sidebar to disconnect.

## Technical Details

### Backend Architecture

- **WebSocket Server**: Real-time bidirectional communication
- **Session Manager**: Manages active sessions and user presence
- **Collaboration Router**: REST and WebSocket endpoints

**Endpoints**:
- `POST /api/collaboration/sessions` - Create a new session
- `GET /api/collaboration/sessions` - List active sessions
- `GET /api/collaboration/sessions/{id}` - Get session state
- `WS /api/collaboration/sessions/{id}/ws` - WebSocket connection

### Frontend Architecture

- **useCollaboration Hook**: Manages WebSocket connection and state
- **CollaborationSidebar**: UI for session management and chat
- **RemoteCursors**: Displays other users' cursors in the editor

### Message Protocol

**Client → Server**:
```json
{
  "type": "cursor_update",
  "file_path": "src/index.ts",
  "line": 42,
  "column": 10
}
```

**Server → Clients**:
```json
{
  "type": "user_joined",
  "user": {
    "id": "uuid",
    "name": "Alice",
    "color": "#FF6B6B"
  }
}
```

### Message Types

- `session_state` - Initial session state sent to new users
- `user_joined` - User joined the session
- `user_left` - User left the session
- `cursor_update` - User's cursor moved
- `selection_update` - User selected text
- `document_edit` - User edited a document
- `chat_message` - User sent a chat message
- `ping`/`pong` - Keepalive heartbeat

## Use Cases

### Pair Programming
Work together on the same code with real-time cursor tracking and instant synchronization.

### Code Review
Review code together while discussing changes in the built-in chat.

### Teaching/Mentoring
Guide junior developers by showing them exactly where you're working in the code.

### Remote Team Collaboration
Multiple team members can work on different files in the same session, with full visibility into everyone's activities.

## Best Practices

1. **Clear Communication**: Use descriptive names when joining sessions
2. **Session Management**: Create new sessions for different tasks/features
3. **Leave When Done**: Always leave the session when finished to free up resources
4. **File Coordination**: Communicate in chat before editing the same file
5. **Network Requirements**: Ensure stable internet connection for best experience

## Security Notes

- Session IDs are randomly generated UUIDs
- Sessions are ephemeral and removed when all users leave
- Inactive sessions are cleaned up after 24 hours
- No authentication required (suitable for trusted environments)

## Future Enhancements

- [ ] Conflict resolution for simultaneous edits
- [ ] File locking mechanism
- [ ] Video/audio chat integration
- [ ] Persistent session history
- [ ] User authentication and permissions
- [ ] Collaborative debugging
- [ ] Screen sharing integration

## Troubleshooting

**Connection Issues**:
- Ensure backend is running on port 8787
- Check browser console for WebSocket errors
- Verify firewall isn't blocking WebSocket connections

**Users Not Appearing**:
- Refresh the page and rejoin the session
- Check that both users are using the same Session ID

**Chat Messages Not Sending**:
- Verify WebSocket connection is active (check "Live" badge)
- Ensure session hasn't timed out

---

Enjoy collaborating with your team in real-time! 🎉
