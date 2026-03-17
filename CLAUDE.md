# CLAUDE.md — Show Me the Model

This file gives Claude Code context for working in this repository.

## Development Commands

```bash
# Backend (from repo root, with venv active)
uvicorn backend.main:app --reload        # dev server on :8000

# Frontend
cd frontend && npm run dev               # dev server on :5173, proxies /api → :8000
cd frontend && npx vite build            # production build → frontend/dist/
```

## Architecture

The app is a React frontend + FastAPI backend. The frontend is a single-page app; Vite proxies `/api` to the backend during development, and Nginx does the same in production.

**Backend entry point:** `backend/main.py`
- Routes: `POST /analyze`, `GET /jobs/{id}/stream` (SSE), `GET /jobs/{id}`, `GET /results/{id}`, `GET /health`
- Background jobs run in asyncio tasks; progress is streamed to the frontend via Server-Sent Events

**Pipeline:** `backend/pipeline.py`
- 4 stages: decomposition → 6 parallel analysis passes → dedup/merge → synthesis
- Each stage calls the LLM API and pushes a `stage_complete` SSE event
- Supports both Anthropic and OpenAI; provider + API key come in per-request headers (`X-Provider`, `X-Api-Key`)
- Tracks token usage and estimates cost using a pricing table at the top of the file

**Prompts:** `prompts/`
- Each stage has its own YAML file with `model`, `temperature`, `max_tokens`, `system_prompt`, and `user_prompt_template`
- Shared fragments (persona, taxonomy) live in `prompts/shared/` and are injected via `{{shared:filename}}` placeholders
- Field-specific examples are in `prompts/shared/examples/` and injected as `{{field_examples}}`
- `backend/prompt_loader.py` handles loading, shared-var resolution, and runtime templating

**Frontend state machine:** `frontend/src/App.jsx`
- Phases: `idle` → `running` → `done` | `error`
- Hash-based routing (`#/results/{analysisId}`) for shareable result links
- API key and provider stored in `localStorage`

## Key Conventions

- **API keys are per-request, not stored server-side.** The frontend sends them in `X-Api-Key` and `X-Provider` headers on every request.
- **Results are saved to disk** as `results/{analysis_id}.json` on job completion. The `results/` directory is gitignored.
- **Job IDs** are 12-char hex strings. **Analysis IDs** are shorter (6–12 char) URL-safe hex strings used in shareable links.
- **SSE events** use type `stage_complete` during the run and `done` / `error` on finish.
- The frontend Vite config proxies `/api` → `http://localhost:8000` in dev. Don't hardcode the backend URL.

## What to Watch Out For

- `pipeline.py` contains a hardcoded pricing table for cost estimation — update it if models or pricing change.
- Email notifications use Resend's HTTP API (not SMTP). DigitalOcean blocks outbound SMTP ports. The code sets a custom `User-Agent: ShowMeTheModel/1.0` header because Resend's WAF blocks Python's default user agent.
- Input limits: 50,000 chars for text, 10 MB for PDFs.
- The `eval/` directory contains gold-standard analyses used for prompt evaluation — don't delete or modify those files casually.
- Stale planning files (`OPENAI_MIGRATION_PLAN.md`, `SUMMARY_DASHBOARD_PLAN.md`, `show-me-the-model-plan.md`, `visual-redesign*.jsx/md`, `next-time.md`) are in the root — these are historical artefacts, not current specs.
