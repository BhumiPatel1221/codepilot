# CodePilot Backend

Node.js backend for collaborative IDE features, Dockerized code execution, and realtime Socket.IO collaboration.

## Features

- REST APIs for rooms, workspaces, projects, execution, and AI chat
- Socket.IO realtime collaboration (presence, edits, cursors, chat)
- Docker-only code execution for Python/JS/TS/Java/C++
- Execution queue with timeout, CPU/memory/pids limits, and cleanup
- Workspace persistence on local JSON store (`backend/data/workspaces.json`)

## Local development

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

Adjust execution guardrails in `.env` if needed (`EXECUTION_*` timeout, size, CPU, memory, and queue settings).

3. Build runner images:

```bash
docker compose --profile runner-images build
```

4. Start backend service:

```bash
docker compose up backend
```

5. Or run backend without container:

```bash
cd backend
npm run start
```

Backend will run on `http://localhost:5001`.

## API endpoints

- `POST /execute`
- `POST /create-room`
- `POST /join-room`
- `GET /workspace/:id`
- `POST /save-project`
- `POST /ai/chat`

## Socket.IO events

- `room:join`, `room:leave`
- `editor:change`, `editor:patch`
- `cursor:update`
- `chat:send`, `chat:message`
- `terminal:subscribe`, `terminal:output`
- `presence:update`
