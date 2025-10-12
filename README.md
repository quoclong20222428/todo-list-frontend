# To-Do App Frontend

This folder contains the React/Vite client for the To-Do App. It provides a Clerk-authenticated interface where users can create, manage, and track tasks while visualising real-time statistics fetched from the backend (`../todo-list-backend`).

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white&style=flat-square)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?logo=radix-ui&logoColor=white&style=flat-square)
![Clerk](https://img.shields.io/badge/Clerk-6B33A8?logo=clerk&logoColor=white&style=flat-square)
![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white&style=flat-square)
![React Router](https://img.shields.io/badge/React_Router-CA4245?logo=react-router&logoColor=white&style=flat-square)

![Main Screen Preview](./src/assets/mainscreen.png)

## Table of contents

- Overview
- Features
- Tech stack
- Project structure
- Environment variables
- Getting started
- Available scripts
- Working with the backend
- Deployment
- Related projects

## Overview

The frontend is built with Vite, React 19, and TypeScript. Styling is handled through Tailwind CSS utilities and custom components based on Radix UI primitives. All API communication goes through a lightweight Axios client that injects Clerk session tokens.

## Features

- Email/passwordless authentication flow powered by Clerk React Router bindings.
- Task creation, edition, deletion, and optimistic refresh using Axios.
- Time-based filters (today, this week, this month, all time) and status filters (pending, inprogress, completed).
- Pagination of task lists with configurable page size (`visibleTaskLimit`).
- Dynamic footer messaging that reacts to task completion counts.
- Toast notifications for success and error states using Sonner.

## Tech stack

- React 19 with React Router 7
- TypeScript 5
- Vite 7 bundler
- Tailwind CSS 4 with utility-first design
- Clerk React SDK for authentication
- Axios for HTTP requests
- Radix UI + shadcn-inspired component abstractions

## Project structure

```
src/
  api/api.ts           // Axios instance with base URL + auth header hook
  components/          // Reusable UI building blocks (Header, AddTask, ...)
  hooks/               // Custom React hooks (reserved for future use)
  lib/data.ts          // Shared constants, types, pagination config
  pages/               // Route-level components (Home, Auth, NotFound)
  main.tsx             // React root bootstrap
  App.tsx              // Router definition and app shell
public/
  clerk.svg, favicon, assets
```

## Environment variables

Create a `.env` file in the project root with:

| Name | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Base URL of the backend (e.g. `http://localhost:3000/api`). |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk key used to initialise the client SDK. |
| `VITE_CLERK_SIGN_IN_URL` | Optional | Custom sign-in path if different from `/sign-in`. |
| `VITE_CLERK_SIGN_UP_URL` | Optional | Custom sign-up path if different from `/sign-up`. |

> Do not commit `.env` files. Create a `.env.example` if you need to share defaults.

## Getting started

1. Install dependencies:
   ```powershell
   cd todo-list-frontend
   npm install
   ```
2. Configure Clerk in the [Clerk dashboard](https://clerk.com/) and copy the publishable key.
3. Ensure the backend is running and reachable (see `../todo-list-backend/README.md`).
4. Create `.env` with the variables listed above.
5. Start the development server:
   ```powershell
   npm run dev
   ```
   Vite serves the app at `http://localhost:5173`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite in development with hot module replacement. |
| `npm run build` | Type-check the project and generate a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint against the source files. |

## Working with the backend

- All API calls are consolidated in `src/api/api.ts`. Update `VITE_API_BASE_URL` to change the target backend without editing code.
- Requests automatically pass the Clerk session token via the `Authorization` header.
- The backend expects routes under `/api/tasks`; the recommended local proxy URL is `http://localhost:3000/api` when running with `npx vercel dev`.
- If you extend the API, add new helper functions beside the existing ones to keep the frontend logic thin.

## Deployment

- Build the project with `npm run build`. Deploy the resulting `dist/` folder to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).
- Configure the production environment variables on the hosting platform (Vite exposes any variable prefixed with `VITE_`).
- Ensure CORS on the backend allows the deployed frontend origin.

## Related projects

- Backend: [../todo-list-backend/README.md](../todo-list-backend/README.md)
- Vietnamese docs: [README.vi.md](README.vi.md)