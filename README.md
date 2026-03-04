# Eris

Eris is a real-time communication platform inspired by Discord.

## Why the name "Eris"?
In Greek mythology, Eris is the goddess of strife and discord. Since this project is a Discord clone, naming it after the literal embodiment of discord seemed like a fitting (and slightly cheeky) homage!

## Current Scope
The project currently focuses on a Minimum Viable Product (MVP) desktop experience that includes:
- **Server Creation:** Users can create and manage their own community servers.
- **Text Channels:** Servers can be organized using text-based channel.
- **Real-Time Chat:** Seamless messaging within text channels.

*(More details to be added as the project evolves!)*

## Front End Stack & Commands
Our front end is built with **Vue JS** (via Vite).

### Running the application
To run the front end application locally:
```sh
cd FrontEnd
npm install
npm run dev
```

### Running tests
We use **Vitest** for our unit tests. To launch the test suite:
```sh
cd FrontEnd
npm run test
```

## Back End Stack & Commands
Our back end is built with **Node JS, TypeScript, and Express**.

### Configuration
Before running the back end, you need to configure your environment variables.
Duplicate the `.env.example` file located inside the **`backend/`** directory and rename it to `.env`:
```sh
cd backend
cp .env.example .env
```
This file contains the server `PORT`, the Prisma `DATABASE_URL`, and the connection string for MongoDB `MONGO_URI`. Adjust them as needed.

### Running the application
To run the back end application locally during development:
1. Ensure the databases are running (see [Database Infrastructure](#database-infrastructure--commands)).
2. Generate Prisma Client:
   ```sh
   cd BackEnd
   npm run prisma:generate
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```

### Running tests
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
Our project relies on a robust database infrastructure to handle different types of data, all managed via **Docker Compose**:
- **PostgreSQL**: Used for general purpose relational data.
- **MongoDB**: Used for storing chat messages.
- **PocketBase**: Used for user authentication and file management.

### Prerequisites
- You must have [Docker](https://www.docker.com/) and Docker Compose installed on your machine.
- Ensure the **root** `.env` file is configured with the database credentials used by Docker Compose (`POSTGRES_*`, `MONGO_*`). A `.env.example` is provided at the repository root — copy it to `.env` if you haven't already:
  ```sh
  cp .env.example .env
  ```

### Running the databases
To launch all the databases in the background, run the following command from the root of the repository:
```sh
docker-compose up -d
```
All databases are configured with persistent volumes to ensure your data is saved across restarts.

### Database Migrations (PostgreSQL)
After starting the PostgreSQL container, you must run the Prisma migrations to set up the schema:
```sh
cd BackEnd
npm run prisma:migrate
```
This will create all necessary tables and indexes for the PostgreSQL database.

### Stopping the databases
To stop the databases, run:
```sh
docker-compose down
```

## Contributing & Development
This project strictly enforces the **Conventional Commits** specification. You must prefix all your commit messages with a valid classification.

### Allowed Commit Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples
- `feat: add new server creation UI`
- `fix(chat): resolve message ordering issue`
- `docs: update setup instructions in README`

### Setting up the Git Hook
We have provided a Git hook to automatically validate your commit messages before they are created. To enable it locally, run this command once from your terminal in the project root:

```sh
git config core.hooksPath .githooks
```
If your commit doesn't follow the formatting, it will be rejected with an error explaining the correct syntax.

## Continuous Integration / Continuous Deployment (CI/CD)
The project is configured with an automated CI/CD pipeline using **GitHub Actions**.

The pipeline is designed to **prevent regressions** from being merged into the primary branch by testing all incoming code changes. As requested, it does not run per commit on any arbitrary tracking branch but only when code is explicitly being integrated into the main application.

### Trigger rules
- The pipeline executes automatically before a merge takes place (specifically on any **Pull Request** targeting the `main` branch).

### Workflow steps
Whenever the workflow is triggered, two independent jobs are executed:
1. **Front End Tests**: Checks out the code, installs Vue.js dependencies, and executes the Vitest suite.
2. **Back End Tests**: Checks out the code, configures a test `.env` file, spins up the temporary Docker databases, installs dependencies, and runs the back end unit and API tests with Jest/Supertest. Finally, it un-provisions the Docker containers even if tests fail.