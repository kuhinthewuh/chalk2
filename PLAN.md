# Project Plan: Live Multimodal AI Tutor Whiteboard

## 0. Product Definition
Build a browser-based AI tutoring whiteboard that understands what a student writes, can inspect their work, speaks conversationally, and responds directly on the canvas with animated handwritten-style annotations. The demo must prove two different modes:

1. **Live algebra:** a judge supplies an arbitrary linear equation. A team member handwrites it live. The app recognizes it and can either tutor through it or solve it step by step on the board.
2. **Visual physics:** the presenter draws a preselected projectile-motion diagram. The app recognizes the diagram and turns it into an interactive animated visualization with trajectory, velocity vector, gravity vector, and a time scrubber. Voice questions about the diagram produce spoken answers and visual highlighting.

The product is not a chat box next to a whiteboard. The canvas itself is the interface.

## 1. Non-Negotiable Demo Behaviors
The final integrated build must support all of these:

- Freehand drawing with mouse, trackpad, or stylus.
- Eraser, undo, redo, clear, selection, and color controls.
- Canvas export to PNG/data URL for multimodal analysis.
- Live recognition of a handwritten linear equation.
- `Solve this` sends the current canvas to the tutor backend.
- AI returns **structured JSON canvas actions**, never arbitrary UI code.
- Client renders AI responses as animated handwriting-style strokes/text.
- AI can circle, underline, point at, or highlight a specific region.
- Student can write their own next step and ask `Where did I go wrong?`.
- Backend identifies the earliest likely error and returns a region to highlight plus a concise explanation.
- Voice input lets the student ask follow-up questions.
- Spoken output reads the tutor response.
- `Teach Me` mode gives hints/questions rather than immediately revealing the answer.
- `Explain` mode may explain a selected or highlighted step.
- `Solve` mode may provide the full solution.
- `Rewind` restores prior canvas snapshots and can jump to the snapshot immediately before the detected error.
- Physics demo recognizes the preselected projectile sketch and launches the interactive projectile visualization.

## 2. Exact Technology Stack
Do not substitute frameworks unless a dependency is impossible to install.

### Application
- Next.js 15+ with App Router
- React 19+
- TypeScript with `strict: true`
- Tailwind CSS 4
- npm
- Deploy to Vercel

### Canvas
- `tldraw` for whiteboard interaction and persistent shape state.
- `perfect-freehand` only for custom AI-generated freehand annotation paths when needed.
- `roughjs` for sketch-like circles, arrows, and highlights.
- `katex` for clean mathematical preview/fallback rendering. Do not use it as the primary handwritten appearance.
- Google Font `Caveat` through `next/font/google` for AI annotation text. If unavailable at build time, fall back to a cursive system font.

### AI / Vision / Tutoring
Use **Google Gemini API** from the server only.
- SDK: `@google/genai`
- Environment variable: `GEMINI_API_KEY`
- Model configuration must be isolated in `src/lib/ai/config.ts` so the model ID can be changed without touching application code.
- Default model: use the current fast Gemini multimodal model available to the team's API key. The integration owner may change only the model ID in the config file if the exact default is unavailable.
- Send the exported canvas PNG plus the user's spoken/typed intent.
- Require structured JSON matching the shared Zod schema.
- Never expose the API key in client-side code.

### Voice
For the hackathon build, use browser-native capabilities to avoid another paid service.
- Speech input: Web Speech API `SpeechRecognition` / `webkitSpeechRecognition`.
- Speech output: `window.speechSynthesis` with `SpeechSynthesisUtterance`.
- Provide a text-input fallback if speech recognition is unavailable.

### Physics Visualization
- `react-three-fiber`
- `three`
- `@react-three/drei`
- Projectile equations are calculated locally. The LLM does not calculate every animation frame.
- Visualization parameters are accepted only through the shared `PhysicsSceneSpec` contract.

### Validation / State
- `zod` for every AI response and API payload.
- Zustand for app-level state that must be shared outside tldraw.
- Do not add Redux.

## 3. Repository Layout: LOCKED
Agents must preserve this structure.

```text
/
├── PLAN.md
├── AGENT_CODEX_CANVAS.md
├── AGENT_CLAUDE_AI.md
├── AGENT_GEMINI_INTEGRATION.md
├── package.json
├── .env.example
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       └── tutor/
│   │           └── route.ts          # CLAUDE owns
│   ├── components/
│   │   ├── canvas/                   # CODEX owns
│   │   ├── physics/                  # CODEX owns
│   │   ├── shell/                    # GEMINI owns
│   │   └── voice/                    # GEMINI owns
│   ├── lib/
│   │   ├── contracts/                # SHARED, frozen after bootstrap
│   │   │   ├── tutor.ts
│   │   │   └── index.ts
│   │   ├── ai/                       # CLAUDE owns
│   │   ├── canvas/                   # CODEX owns
│   │   ├── voice/                    # GEMINI owns
│   │   └── store/                    # GEMINI owns
│   └── types/
│       └── browser-speech.d.ts        # GEMINI owns
└── public/
```

## 4. Shared Contract: FREEZE THIS FIRST
Before parallel work begins, create `src/lib/contracts/tutor.ts`. Once committed, no agent may change it independently.

Required conceptual types:

```ts
export type TutorMode = 'solve' | 'hint' | 'check' | 'explain' | 'physics';

export type NormalizedPoint = { x: number; y: number }; // each 0..1
export type NormalizedBox = { x: number; y: number; width: number; height: number };

export type CanvasAction =
  | { type: 'write'; text: string; at: NormalizedPoint; size?: 'sm'|'md'|'lg'; delayMs?: number }
  | { type: 'circle'; box: NormalizedBox; delayMs?: number }
  | { type: 'underline'; from: NormalizedPoint; to: NormalizedPoint; delayMs?: number }
  | { type: 'arrow'; from: NormalizedPoint; to: NormalizedPoint; label?: string; delayMs?: number }
  | { type: 'highlight'; box: NormalizedBox; delayMs?: number }
  | { type: 'erase-region'; box: NormalizedBox; delayMs?: number };

export type PhysicsSceneSpec = {
  kind: 'projectile';
  initialSpeed: number;
  launchAngleDeg: number;
  gravity: number;
  showTrajectory: boolean;
  showVelocityVector: boolean;
  showGravityVector: boolean;
};

export type TutorRequest = {
  mode: TutorMode;
  canvasImageDataUrl: string;
  userText: string;
  conversationSummary?: string;
};

export type TutorResponse = {
  recognizedContent: string;
  spokenResponse: string;
  canvasActions: CanvasAction[];
  errorRegion?: NormalizedBox;
  errorExplanation?: string;
  physicsScene?: PhysicsSceneSpec;
  confidence: number;
};
```

Implement these as Zod schemas plus inferred TypeScript types. Coordinates are normalized to the canvas bounds so backend code never depends on viewport size.

## 5. API Contract
Only one product AI endpoint is required for the hackathon:

### `POST /api/tutor`
Input: `TutorRequest`.

Server workflow:
1. Validate request with Zod.
2. Remove the `data:image/...;base64,` prefix.
3. Send image bytes and instruction text to Gemini.
4. System instruction tells Gemini it is a visual tutor and must return only data matching `TutorResponse`.
5. Parse structured response.
6. Validate with Zod.
7. If validation fails, make one repair attempt asking Gemini to correct the JSON.
8. If that fails, return a safe typed fallback with `spokenResponse` explaining that the board could not be read clearly.
9. Return JSON.

No database is required.

## 6. AI Tutor Behavior
The server prompt must enforce:

### Recognition
- Read visible handwritten math from the image.
- Preserve signs, exponents, fractions, equals signs, and variable names.
- Use normalized coordinates for references to visible regions.

### Solve mode
- For a linear equation, return a small number of sequential board actions.
- Each mathematical transformation must be valid.
- Prefer one transformation per visual line.
- `spokenResponse` explains the current idea in plain language.

### Hint mode / Teach Me
- Do not reveal the final answer immediately.
- Identify the next conceptual move.
- Use a highlight/circle/arrow when possible.
- Ask one concise tutoring question in `spokenResponse`.

### Check mode
- Compare visible student work across lines.
- Identify the earliest likely incorrect transformation.
- Return `errorRegion` around the problematic work.
- Explain the mistake without insulting or grading the student.

### Explain mode
- Explain the highlighted or most recent transformation.
- Use the board to visually connect the explanation to the relevant symbols.

### Physics mode
- Recognize the known projectile sketch.
- Return `physicsScene.kind = projectile`.
- Infer reasonable demo parameters if labels are visible.
- If values are absent, use `initialSpeed=20`, `launchAngleDeg=45`, `gravity=9.81`.

## 7. UI Specification
The UI should feel like a premium native creative tool, not a school LMS.

### Desktop layout
- Full viewport canvas.
- Floating centered top toolbar.
- Minimal product mark at upper left.
- Mode selector: `Teach Me`, `Check`, `Solve`, `Visualize`.
- Voice orb/button at lower center.
- Compact status pill: `Listening`, `Thinking`, `Writing`, `Ready`.
- Rewind control near bottom left.
- No permanent chat sidebar.

### AI writing behavior
When a `TutorResponse` arrives:
1. Set status to `Writing`.
2. Execute `canvasActions` sequentially.
3. Animate each action rather than instantly placing all elements.
4. Speak `spokenResponse` after the first relevant visual action begins.
5. Set status to `Ready` when finished.

## 8. Physics Demo Specification
The preselected second demo is projectile motion.

Flow:
1. Presenter draws ground line, launch point, projectile arrow, and curved path.
2. Presenter says `Visualize this` or clicks Visualize.
3. Current board image goes to `/api/tutor` in `physics` mode.
4. Response contains `PhysicsSceneSpec`.
5. App opens an elegant overlay/panel over the board with a 3D scene.
6. Ball follows the projectile trajectory.
7. Velocity vector changes through flight.
8. Gravity vector remains downward.
9. Time slider scrubs the simulation.
10. Voice question such as `Why does it slow down on the way up?` is sent with the current board image and conversation context. The spoken response is played while the visualization emphasizes the vertical velocity vector.

The physics engine uses deterministic equations:
- `vx = v0*cos(theta)`
- `vy = v0*sin(theta) - g*t`
- `x = v0*cos(theta)*t`
- `y = v0*sin(theta)*t - 0.5*g*t^2`

Do not ask the LLM to generate frame-by-frame coordinates.

## 9. Rewind System
- Capture tldraw snapshot after every meaningful user stroke batch and before every AI action batch.
- Keep the latest 30 snapshots in memory only.
- Snapshot object includes timestamp and source: `user` or `ai`.
- Rewind UI can step backward/forward.
- When `check` returns an error, mark the current snapshot with the error metadata.
- Demo behavior: jump to the last user snapshot before the erroneous line was added when possible.

## 10. Parallel Ownership

### Codex: Canvas + visual rendering + physics
Exclusive ownership:
- `src/components/canvas/**`
- `src/components/physics/**`
- `src/lib/canvas/**`

Codex consumes shared contracts but never edits them.

### Claude: AI backend + Gemini prompts
Exclusive ownership:
- `src/app/api/tutor/**`
- `src/lib/ai/**`

Claude consumes shared contracts but never edits them.

### Gemini: App shell + voice + state + integration
Exclusive ownership:
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/shell/**`
- `src/components/voice/**`
- `src/lib/voice/**`
- `src/lib/store/**`
- `src/types/**`

Gemini consumes shared contracts but never edits them.

## 11. Integration Interfaces
Codex must export:
- `<TutorCanvas />`
- `<ProjectileVisualization spec={...} />`
- `exportCanvasImage(): Promise<string>` through a ref/interface
- `applyCanvasActions(actions: CanvasAction[]): Promise<void>`
- `captureSnapshot()`
- `rewind()` and `forward()`

Claude must provide:
- Working `POST /api/tutor`
- `buildTutorPrompt(mode, userText)`
- Gemini client wrapper
- Zod-validated structured response

Gemini must wire:
- Canvas ref to API request
- Mode controls to `TutorMode`
- Speech transcript to `userText`
- API response to `applyCanvasActions`
- `spokenResponse` to speech synthesis
- `physicsScene` to `<ProjectileVisualization>`
- Loading/status state

## 12. Failure Handling
The demo must degrade gracefully.

- Speech recognition unavailable: show compact text box.
- Gemini request fails: keep canvas intact and show `Couldn't read that. Try again.`
- Low confidence `< 0.55`: ask the student to rewrite the relevant portion.
- Physics recognition fails: Visualize button may use the fixed default projectile parameters after showing a small `Using demo values` notice.
- 3D/WebGL fails: show a 2D SVG projectile animation using the same equations.
- Never clear the student's board because an API call failed.

## 13. Build Order
### Hour 0-1
- One person bootstraps repository and dependencies.
- Create contracts exactly once.
- Commit as `bootstrap/contracts`.
- All agents branch from that commit.

### Parallel block
- Codex builds canvas and physics components.
- Claude builds `/api/tutor` and prompt pipeline.
- Gemini builds shell, voice, state, and integration adapters using mocked interfaces.

### First integration checkpoint
Must happen before visual polish:
1. Draw equation.
2. Export image.
3. POST image to backend.
4. Receive valid `TutorResponse`.
5. Render at least one AI `write` action.
6. Speak response.

Only after this works should agents add polish.

## 14. Definition of Done
The build is demo-ready only when all of these pass:

- `npm run build` succeeds.
- No TypeScript errors.
- No API key in browser bundle or Git history.
- Judge-provided linear equation can be recognized live.
- AI can render a valid step on the canvas.
- Check mode can visually mark an intentional mistake.
- Voice question receives spoken answer.
- Teach Me mode does not immediately reveal final answer.
- Rewind works for at least five snapshots.
- Projectile demo animates from a recognized drawing.
- App works after a fresh Vercel deployment.

## 15. Scope Prohibitions
Do NOT spend hackathon time on:
- Accounts or authentication.
- Database persistence.
- Payments.
- Mobile-native apps.
- General-purpose support for every school subject.
- Training an OCR model.
- Training a handwriting model.
- Collaborative multiplayer.
- PDF upload.
- Teacher dashboards.

The demo wins by making the two core experiences exceptional.

## 16. Merge Protocol
1. Bootstrap owner creates repository, installs shared dependencies, adds contracts, and commits.
2. Create branches exactly named:
   - `agent/codex-canvas`
   - `agent/claude-ai`
   - `agent/gemini-integration`
3. Each agent receives `PLAN.md` plus its own task file.
4. Each agent edits only its owned paths.
5. Each agent must run `npm run build` before handoff.
6. Merge Codex first.
7. Merge Claude second.
8. Merge Gemini last because Gemini owns the integration shell.
9. Resolve imports in the integration branch only. Do not rewrite another agent's implementation during merge unless compilation requires it.
10. Run `npm install`, `npm run build`, and a manual end-to-end test.
11. Add `GEMINI_API_KEY` to local `.env.local` and Vercel environment settings. Never commit it.
12. Deploy to Vercel only after the live algebra path passes locally.


## 15. Mandatory GitHub Collaboration Workflow
This repository is the single source of truth. All three developers must clone the SAME GitHub repository onto their own devices. Nobody creates a separate project or separate repository.

Before any coding agent begins, a human must make one bootstrap commit on `main` containing the app skeleton, this PLAN, all agent task files, dependency manifests, and the frozen shared contracts. Push that commit. All agent branches MUST start from that exact `main` commit.

Required branches:
- Codex: `agent/codex-canvas`
- Claude: `agent/claude-ai`
- Gemini: `agent/gemini-integration`

Each developer runs: `git clone <REPO_URL>`, enters the repo, runs `git checkout main`, `git pull origin main`, then creates only their assigned branch with `git checkout -b <ASSIGNED_BRANCH>`.

Agents edit the LOCAL CLONE on their assigned branch. They must never work directly on `main`. They must never force-push. They must never create another repository. They must never merge another agent's branch themselves.

At useful milestones and at completion, commit only owned files. Before opening the PR, run the required tests/build, then `git push -u origin <ASSIGNED_BRANCH>`. Open a GitHub Pull Request targeting `main`. PR title format: `[AGENT] <module> implementation`.

Every PR description must contain: files changed, dependencies added, tests/build run, known limitations, required environment variables, integration notes, and any expected follow-up. Do NOT merge the PR until integration review.

If an agent discovers that a frozen contract or another agent-owned file must change, it must STOP rather than editing it. Report the requested change in the PR/handoff so the team can coordinate it deliberately.

### Integration order
Keep `main` protected conceptually as the stable integration branch. After all PRs exist, review them against ownership boundaries. Merge Codex and Claude module PRs first in either order if they do not conflict. Update Gemini's integration branch from current `main`, remove only its temporary adapters/mocks, resolve imports to the real modules, rerun the complete build, then merge the Gemini PR last. Afterward run the full demo acceptance test on `main` and deploy that exact commit.
