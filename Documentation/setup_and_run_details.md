# Eris Setup and Configuration Details

This document contains detailed information regarding the individual configuration, execution, and CI/CD parameters of the Eris application. 
For a quick start guide, please refer to the `README.md` file in the root directory.

## Front End Stack & Commands
Our front end is built with **Vue JS** (via Vite).

### Running the application standalone
To run the front end application locally without the root script:
```sh
cd FrontEnd
npm install
npm run dev
```

### Running tests standalone
We use **Vitest** for our unit tests. To launch the test suite:
```sh
cd FrontEnd
npm run test
```

## Back End Stack & Commands
Our back end is built with **Node JS, TypeScript, and Express**.

### Configuration
All environment variables live in a **single `.env` file at the repository root**. Copy the provided example once:
```sh
# Mac/Linux
cp .env.example .env

# Windows
copy .env.example .env
```
The file contains credentials for all three databases, connection strings (`DATABASE_URL`, `MONGO_URI`), PocketBase settings, and the backend `PORT`. Adjust values as needed.

> **No `BackEnd/.env` is required.** The backend reads all configuration from the root `.env` via `jest.setup.ts` (tests) and standard `process.env` (runtime).

### Running the application standalone
To run the back end application locally during development:
1. Ensure databases are running: `npm run db:up`
2. Generate Prisma Client:
   ```sh
   cd BackEnd
   npm run prisma:generate
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```

### Running tests standalone
We use **Jest** and **Supertest** for our unit tests and API testing. To launch the test suite:
```sh
cd BackEnd
npm run test
```
To run specifically the database schema verification tests:
```sh
npm test tests/prisma.test.ts
```

## Database Infrastructure & Commands
Our project relies on a robust database infrastructure, all managed via **Docker Compose**:
- **PostgreSQL**: Relational data (via Prisma).
- **MongoDB**: Chat message storage.
- **PocketBase**: User authentication and file management.

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose must be installed.
- The root `.env` file must exist (see Configuration above).

### Running the databases
To launch all databases and automatically initialize the PocketBase admin account:
```sh
npm run db:up
```
This starts all containers. The `pocketbase-init` service will automatically create the superuser account once PocketBase is healthy. This is **idempotent** — safe to run multiple times.

### Database Migrations (PostgreSQL)
After the databases are running, apply Prisma migrations:
```sh
npm run db:migrate:deploy   # CI / production (non-interactive)
npm run db:migrate          # local dev (interactive, creates migration files)
```

### Resetting the entire database environment
To wipe all volumes and reinitialize from scratch:
```sh
npm run db:reset
```
This runs `docker compose down -v` followed by `db:init` (bring up containers, deploy migrations, init PocketBase admin).

### Stopping the databases
```sh
npm run db:down
```

## Continuous Integration / Continuous Deployment (CI/CD)
The project is configured with an automated CI/CD pipeline using **GitHub Actions**.

The pipeline **prevents regressions** from being merged by testing all incoming changes. It runs on **Pull Requests** targeting the `main` or `dev` branches.

### Workflow steps
Two independent jobs run on every trigger:

1. **Front End Tests**: Checks out the code, installs Vue.js dependencies, and runs the Vitest suite.
2. **Back End Tests**:
   - Checks out the code and copies `.env.example → .env` (single file, no manual setup)
   - Starts PostgreSQL, MongoDB, and PocketBase containers
   - Waits for each service to be healthy
   - Runs `docker compose run --rm pocketbase-init` to create the PocketBase admin
   - Runs `prisma migrate deploy` (non-interactive, CI-safe)
   - Executes the Jest test suite
   - Tears down all containers **and volumes** (`docker compose down -v`) even on failure
