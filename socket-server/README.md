# PROXIMITY Socket.IO Server

This is a separate Socket.IO server for the PROXIMITY dating app, designed to handle real-time features independently from the main Next.js application.

## Features

- **Real-time Messaging**: Private and group messaging
- **User Presence**: Track online users and their status
- **Room Support**: Multi-user chat rooms
- **Typing Indicators**: Real-time typing notifications
- **Read Receipts**: Message delivery confirmation
- **Error Handling**: Comprehensive error management
- **Health Checks**: Monitoring endpoint for deployment

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOCKET_PORT` | Port for the Socket.IO server | `3001` |
| `CORS_ORIGIN` | Allowed origin for CORS | `http://localhost:3000` |

### API Endpoints

- `GET /health` - Health check and server status

## Socket.IO Events

### Client to Server

| Event | Description | Payload |
|-------|-------------|---------|
| `user:join` | User joins the app | `{ userId, username }` |
| `message:private` | Send private message | `{ toUserId, content, fromUserId }` |
| `room:join` | Join a chat room | `{ roomId, userId }` |
| `room:message` | Send message to room | `{ roomId, content, userId }` |
| `typing:start` | User starts typing | `{ roomId, userId }` |
| `typing:stop` | User stops typing | `{ roomId, userId }` |
| `message:read` | Mark message as read | `{ messageId, fromUserId }` |

### Server to Client

| Event | Description | Payload |
|-------|-------------|---------|
| `message` | System message | `{ type, content, timestamp }` |
| `user:joined` | User joined notification | `{ userId, username, socketId, timestamp }` |
| `user:left` | User left notification | `{ userId, socketId, timestamp }` |
| `user:list` | Current user list | `Array<{ userId, socketId, joinedAt }>` |
| `message:private` | Private message received | `{ fromUserId, toUserId, content, timestamp }` |
| `message:delivered` | Message delivery confirmation | `{ toUserId, content, timestamp }` |
| `room:user_joined` | User joined room | `{ roomId, userId, socketId, timestamp }` |
| `room:user_left` | User left room | `{ roomId, userId, socketId, timestamp }` |
| `room:users` | Room user list | `{ roomId, users }` |
| `room:message` | Room message received | `{ roomId, fromUserId, content, timestamp }` |
| `typing:start` | User started typing | `{ userId }` |
| `typing:stop` | User stopped typing | `{ userId }` |
| `message:read` | Message read confirmation | `{ messageId, readBy, timestamp }` |
| `error` | Error notification | `{ type, message, timestamp }` |

## Deployment

### Local Development

The Socket.IO server runs on port 3001 by default and connects to the Next.js app running on port 3000.

### Production Deployment

1. **Environment Setup**: Set production CORS origin
2. **Build**: `npm run build`
3. **Deploy**: Deploy to any Node.js hosting service (Railway, Heroku, Digital Ocean, etc.)

### Example Railway Deployment

```yaml
# railway.toml
[build]
command = "npm run build"

[deploy]
startCommand = "npm start"

[env]
SOCKET_PORT = "3001"
CORS_ORIGIN = "https://your-app.vercel.app"
```

## Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   Next.js App   │ ◄────────────► │  Socket.IO Server │
│   (Port 3000)   │                │   (Port 3001)     │
└─────────────────┘                └──────────────────┘
```

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "message": "PROXIMITY Socket.IO Server is running",
  "port": 3001,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "connectedClients": 5
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `CORS_ORIGIN` matches your app's URL
2. **Connection Issues**: Check firewall settings and port availability
3. **Memory Leaks**: Monitor active connections and clean up disconnected users

### Debug Mode

Set `DEBUG=socket.io:*` to enable Socket.IO debug logging.

## Security

- CORS configuration for cross-origin requests
- Input validation for all events
- Connection rate limiting (recommended for production)
- Authentication integration (can be added via JWT tokens)

## License

This project is part of the PROXIMITY dating application.