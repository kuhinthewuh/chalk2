# Live Multimodal AI Tutor Whiteboard

A browser-based AI tutoring whiteboard: students write math (or sketch a physics diagram) by hand, the app reads the canvas with Gemini's multimodal API, and responds directly on the board with animated annotations and a spoken explanation. See [`PLAN.md`](./PLAN.md) for the full product spec, and the `AGENT_*.md` files for each agent's scoped task.

## Stack

- **App**: Next.js 15 (App Router), React 19, TypeScript (`strict`), Tailwind CSS 4
- **Canvas**: `tldraw`, `perfect-freehand`, `roughjs`, `katex`
- **AI**: Google Gemini (`@google/genai`), server-only, structured JSON output validated with `zod`
- **Voice**: browser-native `SpeechRecognition` / `speechSynthesis`
- **Physics**: `react-three-fiber`, `three`, `@react-three/drei`
- **State**: Zustand

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in GEMINI_API_KEY
npm run dev
```

`GEMINI_API_KEY` is server-only — never expose it to the client or prefix it `NEXT_PUBLIC_`.

## Repository layout & ownership

Three agents work in parallel on separate branches against a locked directory structure (see [`PLAN.md`](./PLAN.md) sections 3 and 10 for the full breakdown):

| Branch | Owns | Scope |
|---|---|---|
| `agent/codex-canvas` | `src/components/canvas/**`, `src/components/physics/**`, `src/lib/canvas/**` | Whiteboard interaction, physics visualization |
| `agent/claude-ai` | `src/app/api/tutor/**`, `src/lib/ai/**` | Gemini backend, prompts, structured-output validation |
| `agent/gemini-integration` | `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/shell/**`, `src/components/voice/**`, `src/lib/voice/**`, `src/lib/store/**`, `src/types/**` | App shell, voice, state, integration |

`src/lib/contracts/**` (the `TutorRequest`/`TutorResponse` Zod contract) is frozen after the bootstrap commit — no agent edits it independently. `main` stays the integration branch; merge order is Codex, then Claude, then Gemini (`PLAN.md` §16).

## Status

- Bootstrap skeleton + frozen contracts: on `main`.
- Tutor backend (`POST /api/tutor`): implemented on `agent/claude-ai`.
- Canvas/physics and app shell/voice/integration: in progress on their respective branches.
