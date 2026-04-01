# QR-Thrive Workspace

This repository is a full-stack monorepo structured using [Turborepo](https://turbo.build/repo) and [pnpm](https://pnpm.io/) workspaces.

## Architecture

The workspace consists of the following applications:

- **`apps/web`**: The frontend web application built with [React 19](https://react.dev/) and [Vite](https://vitejs.dev/). It utilizes [Tailwind CSS v4](https://tailwindcss.com/) for styling and includes libraries for QR code generation (`qr-code-styling`), icons (`lucide-react`), and charts (`recharts`).
- **`apps/api`**: The backend API service built with [NestJS](https://nestjs.com/), providing robust server-side capabilities.

## Prerequisites

Before getting started, make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (v10.x or higher is recommended)

## Getting Started

### 1. Install Dependencies

From the root directory, install all dependencies for the entire workspace:

```bash
pnpm install
```

### 2. Development Mode

To start the development servers for all applications (frontend and backend) simultaneously, run:

```bash
pnpm run dev
```

This uses Turborepo to concurrently start:
- Vite dev server in `apps/web`
- NestJS dev server with hot-reload in `apps/api`

### 3. Build for Production

To build all the applications and packages:

```bash
pnpm run build
```

Turborepo will cache build outputs (`dist/` directories) for faster subsequent builds.

### 4. Linting

Run linters across the workspace to ensure code quality:

```bash
pnpm run lint
```

## Tech Stack Highlights

- **Workspace Management**: Turborepo, pnpm workspaces
- **Frontend**: React 19, Vite, Tailwind CSS v4, TypeScript
- **Backend**: NestJS, TypeScript, Jest
