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
