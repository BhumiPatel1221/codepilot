# CodePilot

CodePilot is an advanced, web-based collaborative IDE with integrated AI assistance, terminal execution, and real-time multiplayer capabilities. 

##  Features

- **Web-Based IDE**: Fully featured code editor powered by Monaco Editor.
- **AI Integration**: Integrated Google Generative AI for intelligent code suggestions and assistance.
- **Real-Time Collaboration**: Work with others seamlessly using WebSockets.
- **Terminal Execution**: Integrated terminal powered by `node-pty` to run commands directly from the browser.
- **Docker Support**: Containerized execution environments for running code safely.

##  Tech Stack

### Frontend
- **Framework**: Next.js 15, React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Real-time**: Socket.io Client

### Backend
- **Server**: Node.js & Express
- **Real-time**: Socket.io
- **AI**: Google Generative AI
- **Terminal**: `node-pty` for pseudo-terminal sessions
- **Execution**: Docker for isolated runner environments


