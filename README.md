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
Duplicate the `.env.example` file located at the **root** of the repository and rename it to `.env`. Alternatively, run the following from the project root:
```sh
cp .env.example .env
```
*(Optionally, adjust the `PORT` or any future variables inside your new `.env` file.)*

### Running the application
To run the back end application locally during development:
```sh
cd BackEnd
npm run dev
```

### Running tests
We use **Jest** and **Supertest** for our unit tests and API testing. To launch the test suite:
```sh
cd BackEnd
npm run test
```

## Database Infrastructure & Commands
Our project relies on a robust database infrastructure to handle different types of data, all managed via **Docker Compose**:
- **PostgreSQL**: Used for general purpose relational data.
- **MongoDB**: Used for storing chat messages.
- **Pocketbase**: Used for user authentication and secure account creation.

### Prerequisites
- You must have [Docker](https://www.docker.com/) and Docker Compose installed on your machine.
- Ensure your `.env` file is configured with the necessary database credentials (see the Back End Configuration section).

### Running the databases
To launch all the databases in the background, run the following command from the root of the repository:
```sh
docker-compose up -d
```
All databases are configured with persistent volumes to ensure your data is saved across restarts.

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
