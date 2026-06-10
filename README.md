# CodePilot
CodePilot is a modern, web-based collaborative IDE built with Next.js and React. It features a fully integrated development environment with code editing, a built-in terminal, and real-time collaboration capabilities. The platform uses Docker for secure code execution and Supabase for authentication and data persistence.

 # Features
Advanced Code Editing: Powered by Monaco Editor (the core of VS Code) with syntax highlighting, autocomplete, and more.
Integrated Terminal: Fully functional in-browser terminal using XTerm.js, allowing you to run commands and manage your environment.
Real-time Collaboration: Built with Socket.io for live syncing, editing, and shared terminal sessions.
Secure Code Execution: Containerized backend execution environment using Docker to safely run code and tests.
Authentication & Database: Integrated with Supabase for robust user authentication and secure data storage.
Modern UI: Designed with Tailwind CSS, Radix UI components (via heroicons and lucide-react), and dynamic resizable panels.

 # Tech Stack
Frontend Framework: Next.js 15 (App Router, React 19)
Language: TypeScript
Styling: Tailwind CSS
Code Editor: @monaco-editor/react
Terminal: XTerm.js
Real-time Communication: Socket.io
Backend/BaaS: Supabase
Containerization: Docker

# Getting Started
Prerequisites
Ensure you have the following installed:

Node.js (v20 or higher recommended)
npm
Docker (required for backend code execution)
A Supabase account/project

# Installation
Clone the repository:

bash
git clone https://github.com/your-username/codepilot.git
cd codepilot
Install dependencies:

bash
npm install
Configure Environment Variables: Copy the .env.example file to create a .env file:

bash
cp .env.example .env
Fill in your Supabase credentials and other required variables in the .env file.

Run the development server:

bash
npm run dev
The application will be available at http://localhost:4028.

# Scripts
npm run dev: Starts the Next.js development server on port 4028.
npm run build: Builds the application for production.
npm run start: Starts the production server.
npm run lint: Runs ESLint to find code issues.
npm run lint:fix: Automatically fixes ESLint issues.
npm run format: Formats code using Prettier.
npm run type-check: Runs TypeScript type checking.
