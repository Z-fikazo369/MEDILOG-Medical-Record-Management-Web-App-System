# MEDILOG Frontend

This folder contains the React + TypeScript frontend for MEDILOG.

The frontend handles the student and admin portal interfaces, form workflows, dashboard views, and API communication with the backend server.

## Stack

- React 19
- TypeScript
- Vite
- Bootstrap + Bootstrap Icons
- Recharts / Chart.js
- Axios

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Add your environment variables in a local .env file.

3. Start the dev server

```bash
npm run dev
```

The app runs on http://localhost:5173 by default.

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Notes

- API requests are proxied through Vite to the backend during local development.
- For full system setup, check the root README in the repository.
