# Planning

## Goal
Dockerize the `Talkative-Tribe` application (Frontend, Backend, Database) and configure it to use a local Ollama instance (`llama3.2:3b`) for AI features, removing previous LLM dependencies.

## Steps

1.  **Database Configuration**
    *   Switch `docker-compose.yml` from PostgreSQL to MongoDB as required by `backend/prisma/schema.prisma`.
    *   Ensure the Backend service in Docker uses the correct `DATABASE_URL` for MongoDB.

2.  **Backend Configuration**
    *   Remove Gemini/Google GenAI dependencies from `backend/package.json` to clean up unused LLM models.
    *   Ensure `backend/src/configs/ai/agent.ts` is correctly configured to use `ChatOllama` with `llama3.2:3b` and points to `http://host.docker.internal:11434`.
    *   Add `OLLAMA_BASE_URL` to `docker-compose.yml` environment variables for the backend.
    *   Ensure `SALT_ROUNDS` and `JWT_SECRET_KEY` are set in `docker-compose.yml`.

3.  **Frontend Configuration**
    *   Update `frontend/Dockerfile` to accept `VITE_BACKEND_SERVER_URL` as a build argument (`ARG`). Vite requires these at build time to inline them into the static bundle.
    *   Update `docker-compose.yml` to pass `VITE_BACKEND_SERVER_URL` in the `build: args` section for the frontend service.

4.  **Docker Compose Refactoring**
    *   Define services: `mongo`, `backend`, `frontend`.
    *   Configure networks and volumes.
    *   Ensure `host.docker.internal` is accessible (automatically available on Docker Desktop for Mac/Windows; might need `extra_hosts` for Linux, but user is on Darwin).

5.  **Verification**
    *   Review `backend/Dockerfile` and `frontend/Dockerfile` to ensure they correctly build the local `common` package dependency (using the existing `sed` strategy).

## Details

### Database
- Image: `mongo:latest`
- Service Name: `mongo`
- Port: `27017:27017`

### Backend
- Env Vars:
    - `DATABASE_URL="mongodb://mongo:27017/talkative_tribe"`
    - `OLLAMA_BASE_URL="http://host.docker.internal:11434"`
    - `FRONTEND_SERVER_URL="http://localhost:5173"`

### Frontend
- Build Arg: `VITE_BACKEND_SERVER_URL="http://localhost:8998"` (or `http://localhost:8998` exposed to host).
- Nginx setup in Dockerfile is already present.

## Cleanup
- Remove unused Google AI packages from `backend`.
