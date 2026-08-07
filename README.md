# AI Interview System

An AI-powered interview platform with a voice agent (LiveKit), a FastAPI backend, and a Next.js frontend.

## Architecture

| Component | Path | Description |
|---|---|---|
| `web` | `apps/web` | Next.js 14 frontend |
| `api` | `apps/api` | FastAPI backend (Postgres + Mongo) |
| `voice-agent` | `services/voice-agent` | LiveKit voice agent worker |
| `postgres` | — | Primary relational store (pgvector) |
| `mongo` | — | Transcript/log storage |
| `livekit` | — | Real-time media server for interview calls |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Node.js 20+ (only needed for frontend development outside Docker)
- Python 3.12+ (only needed for backend development outside Docker)
- An OpenAI API key (used for resume/JD parsing, embeddings, and scoring)

## Local Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd AI-interview-system
```

### 2. Configure environment variables

Copy the template and fill in the values (at minimum `OPENAI_API_KEY`):

```bash
cp configs/env.template configs/dev.env
```

Edit `configs/dev.env` and set:

- `OPENAI_API_KEY` — required for AI features
- `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` — for local dev these can match the `keys` entry in `infra/docker/livekit/livekit.yaml` (default `devkey` / `devsecret`), with `LIVEKIT_URL=ws://localhost:7880`
- `NEXT_PUBLIC_API_URL` — `http://localhost:8000` for local dev
- `SECRET_KEY` — any local dev secret is fine (the template default works for local use)

`configs/dev.env` is gitignored, so it's safe to keep real secrets there.

### 3. Start the stack

```bash
docker compose up --build
```

This builds and starts:

- `postgres` on `localhost:5432`
- `mongo` on `localhost:27017`
- `livekit` on `localhost:7880` (WebSocket/API), `7881`, `7882/udp`
- `api` (FastAPI) on `localhost:8000`
- `voice-agent` (LiveKit agent worker, no exposed port)
- `web` (Next.js) on `localhost:3000`

### 4. Apply database migrations

`infra/docker/postgres/init.sql` bootstraps the base schema automatically the first time the `postgres` volume is created. Numbered migration files in `infra/docker/postgres/migrations/` are **not** applied automatically and must be run manually, in order, against the running database:

```bash
for f in infra/docker/postgres/migrations/*.sql; do
  docker compose exec -T postgres psql -U ${POSTGRES_USER:-jiangboqiu} -d ${POSTGRES_DB:-interview} -f - < "$f"
done
```

> If you change `init.sql` after the `postgres` volume already exists, it won't re-run. Reset with `docker compose down -v` to force a clean re-init (this deletes local DB data).

### 5. Verify

- API health check: `curl http://localhost:8000/health`
- Frontend: open [http://localhost:3000](http://localhost:3000)

## Running services individually (without Docker)

### API (`apps/api`)

```bash
cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' ../../configs/dev.env | xargs)  # or set env vars manually
uvicorn main:app --reload --port 8000
```

Requires `postgres` and `mongo` reachable at the URLs in `configs/dev.env` (e.g. run just those two via `docker compose up postgres mongo`).

### Web (`apps/web`)

```bash
cd apps/web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Voice agent (`services/voice-agent`)

```bash
cd services/voice-agent
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' ../../configs/dev.env | xargs)
python agent.py dev
```

Requires `livekit` and `api` reachable, and `LIVEKIT_URL`/`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` set.

## Useful commands

```bash
docker compose up --build       # build and start all services
docker compose down             # stop all services
docker compose down -v          # stop and wipe volumes (Postgres/Mongo data)
docker compose logs -f api      # tail logs for a specific service
```

## Uploaded files

Uploaded documents (resumes, etc.) are stored on disk under `uploads/` (mounted into the `api` container) and are gitignored.
