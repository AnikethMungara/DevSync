# Real-Time Collaborative Editing Guide

## Overview

DevSync now supports real-time collaborative editing using WebSockets! Multiple users can edit the same files simultaneously and see each other's changes in real-time.

## Features

- **Real-time text synchronization** - See changes from other users as they type
- **Cursor presence** - View where other users are editing with color-coded cursors
- **User presence** - See who's online in your collaboration session
- **Session-based collaboration** - Create or join sessions using session IDs
- **Chat messaging** - Communicate with collaborators via built-in chat
- **Operational Transformation** - Conflict-free collaborative editing using OT algorithms

## How to Use

### Starting a Collaboration Session

1. **Open the Collaboration Sidebar**
   - Click the "Users" icon in the activity bar on the left side

2. **Enter Your Name**
   - Type your name in the input field

3. **Start a New Session**
   - Click "Start New Session"
   - A unique session ID will be generated
   - Share this session ID with collaborators

### Joining a Session

1. **Open the Collaboration Sidebar**
   - Click the "Users" icon in the activity bar

2. **Enter Your Name**
   - Type your name in the input field

3. **Click "Join Session"**
   - Paste the session ID you received
   - Press Enter to join

### Collaborative Editing

Once connected to a session:

- **Open any file** - Changes are synchronized across all users
- **See remote cursors** - Other users' cursors appear with their name and color
- **Online indicator** - Green badge shows connection status and user count
- **Real-time updates** - Text changes appear instantly for all users

### Chatting with Collaborators

- Navigate to the Chat section in the Collaboration Sidebar
- Type your message and press Enter or click Send
- All session participants will see your messages

### Leaving a Session

- Click "Leave Session" in the Collaboration Sidebar
- Your edits are saved, but you'll disconnect from the session

## Technical Architecture

### Frontend Components

1. **`use-collaborative-editor.ts`** - React hook managing collaborative editing state
   - Handles local and remote text changes
   - Synchronizes cursor positions
   - Manages WebSocket connection

2. **`text-sync.ts`** - Operational Transformation utilities
   - `diffTexts()` - Calculate differences between text versions
   - `applyOperation()` - Apply text operations
   - `transformCursorPosition()` - Adjust cursor positions based on edits

3. **`remote-cursors-overlay.tsx`** - Visual overlay for remote cursors
   - Displays other users' cursor positions
   - Shows user names and colors

4. **`collaboration-store.ts`** - Global Zustand store
   - Manages session state
   - Handles session creation/joining/leaving

5. **`editor-pane.tsx`** - Enhanced editor component
   - Integrates collaborative editing
   - Displays connection status
   - Broadcasts cursor and text changes

### Backend API

1. **WebSocket Endpoint**: `WS /api/collaboration/sessions/{session_id}/ws`
   - Real-time bidirectional communication
   - Message types:
     - `cursor_update` - Cursor position changes
     - `selection_update` - Text selection changes
     - `document_edit` - Text edit operations
     - `chat_message` - Chat messages
     - `user_joined` / `user_left` - Presence updates
     - `ping` / `pong` - Keep-alive

2. **Session Management** (`session_manager.py`)
   - Manages active collaboration sessions
   - Tracks connected users and their states
   - Broadcasts messages to session participants
   - Auto-cleanup of inactive sessions

3. **REST Endpoints**:
   - `POST /api/collaboration/sessions` - Create new session
   - `GET /api/collaboration/sessions` - List active sessions
   - `GET /api/collaboration/sessions/{id}` - Get session state

### Data Flow

```
User A types → diffTexts() → Operation → WebSocket → Backend
                                              ↓
Backend → Broadcast to other users → User B receives operation
                                              ↓
User B → applyOperation() → Update text → Transform cursor
```

## Configuration

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

**Backend** (`backend/.env`):
```
# WebSocket configuration is handled automatically
# Default CORS allows localhost:3000
```

### Customization

**User Colors**: Edit `USER_COLORS` array in [backend/app/routers/collaboration.py](backend/app/routers/collaboration.py:49-52)

**Session Timeout**: Adjust `max_inactive_hours` in session cleanup (default: 24 hours)

**Ping Interval**: Change in [frontend/hooks/use-collaboration.ts](frontend/hooks/use-collaboration.ts:270) (default: 30 seconds)

## Known Limitations

1. **Basic OT Implementation** - Uses simplified diff algorithm. For production, consider using established CRDT libraries like Yjs or Automerge.

2. **Cursor Position Approximation** - Remote cursor positioning uses character width estimation. May not be pixel-perfect for all fonts.

3. **No Conflict Resolution UI** - Concurrent edits are merged automatically. No manual conflict resolution interface.

4. **Session Persistence** - Sessions are in-memory only. Restarting the backend clears all sessions.

5. **Textarea Limitation** - Currently uses a basic textarea. For better editing experience, consider integrating CodeMirror or Monaco Editor with collaborative extensions.

## Future Enhancements

- [ ] Rich text editor integration (Monaco/CodeMirror)
- [ ] Selection highlighting for remote users
- [ ] Undo/redo with collaborative awareness
- [ ] File locking options
- [ ] Persistent session storage
- [ ] Audio/video chat integration
- [ ] User permissions and roles
- [ ] Session recording and playback

## Troubleshooting

### Connection Issues

**Problem**: "Failed to connect" error
- **Solution**: Ensure backend is running on port 8787
- **Solution**: Check CORS configuration in [backend/main.py](backend/main.py)

**Problem**: Disconnects frequently
- **Solution**: Check network stability
- **Solution**: Verify WebSocket timeout settings

### Synchronization Issues

**Problem**: Changes not appearing for other users
- **Solution**: Verify all users are in the same session
- **Solution**: Check browser console for WebSocket errors

**Problem**: Cursor positions incorrect
- **Solution**: Ensure all users have the same file open
- **Solution**: Try refreshing the page

### Performance Issues

**Problem**: Lag when typing
- **Solution**: Reduce number of concurrent users
- **Solution**: Check network latency
- **Solution**: Consider debouncing cursor updates

## Development

### Running Tests

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
pytest tests/test_collaboration.py
```

### Adding New Message Types

1. Define message type in [session_manager.py](backend/app/collaboration/session_manager.py)
2. Handle in WebSocket endpoint [collaboration.py](backend/app/routers/collaboration.py:150-194)
3. Update frontend hook [use-collaboration.ts](frontend/hooks/use-collaboration.ts:110-158)

## Support

For issues or questions:
- Create an issue in the repository
- Check existing documentation
- Review WebSocket console logs for debugging

---

**Built with**: FastAPI (Backend), Next.js (Frontend), WebSockets, Operational Transformation
