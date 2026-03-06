# Eris Frontend

Vue 3 + Vite application for the Eris platform.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and update values as needed:
   ```bash
   cp .env.example .env
   ```

   Environment variables:
   - `VITE_API_URL` - Backend API URL (default: http://localhost:3000)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

- `src/components/` - Reusable Vue components
- `src/views/` - Page components (routes)
- `src/router/` - Vue Router configuration
- `src/assets/` - Static assets (images, styles)

## Tech Stack

- Vue 3 with `<script setup>` SFCs
- Vite for build tooling
- Vue Router for navigation
- Vitest for unit testing

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
