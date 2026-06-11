# CodePilot

CodePilot is an advanced, web-based collaborative IDE with integrated AI assistance, terminal execution, and real-time multiplayer capabilities. 

## 🚀 Features

- **Web-Based IDE**: Fully featured code editor powered by Monaco Editor.
- **AI Integration**: Integrated Google Generative AI for intelligent code suggestions and assistance.
- **Real-Time Collaboration**: Work with others seamlessly using WebSockets.
- **Terminal Execution**: Integrated terminal powered by `node-pty` to run commands directly from the browser.
- **Docker Support**: Containerized execution environments for running code safely.

## 🛠️ Tech Stack

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

## ⚙️ Getting Started

### Prerequisites
- Node.js (v20+)
- Docker (for execution environments)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd codepilot
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

### Configuration

Create a `.env` file in the root directory and the `backend` directory based on the provided `.env.example` files. Make sure to configure your required API keys (e.g., Google AI Studio key).

### Running the Application

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend Development Server:**
   ```bash
   # From the root directory
   npm run dev
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:4028`.

## 📁 Project Structure

- `/src` - Frontend Next.js application containing components, hooks, and pages.
- `/backend` - Node.js Express server handling execution, WebSockets, and AI services.
- `/runners` - Dockerfile definitions for isolated language-specific execution environments.
- `/public` - Static assets.

