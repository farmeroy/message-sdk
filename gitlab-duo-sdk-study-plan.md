# GitLab Duo Client SDK — Focused Study Plan

The goal: be able to speak intelligently about SDK design, packaging, and
isomorphic TypeScript in technical discussions. The fastest path is to build a
small SDK that exercises every concept the role cares about.

---

## The Project: Build an Anthropic Client SDK

Build an isomorphic TypeScript SDK that wraps the Anthropic Messages API. This
is the right level of complexity: it needs to work in Node (CLI tools, server
apps) and the browser (chat UIs), has real streaming to handle, real auth
differences per platform, and real API surface design decisions. You already
know the domain from using Claude Code daily, so you can focus on *how to
package it* rather than learning what the API does.

Structure:

```
anthropic-sdk/
├── packages/
│   ├── core/           # types, message builder, response parsing, streaming
│   │                   #   protocol — no platform-specific imports
│   ├── node/           # Node adapter: env-based API key, Node fetch/streams
│   ├── browser/        # Browser adapter: passed-in key, ReadableStream/SSE
│   └── react/          # useChat() hook — optional, ties into Phase 7 (Vue too)
├── examples/
│   ├── cli/            # Node consumer — simple prompt→response script
│   └── web/            # Vite app consumer — streaming chat UI
├── package.json        # workspace root
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

Why this project specifically:
- **Isomorphic**: fetch, streams, and auth all differ between Node and browser
- **Streaming**: SSE parsing, async iterators, backpressure — real SDK problems
- **Auth adapters**: API key from `process.env` in Node vs passed as config in
  browser (never expose keys client-side in production, but the adapter pattern
  is the same one GitLab Duo uses for bearer tokens vs session cookies)
- **API design**: how do you type `stream: true` so the return type changes?
  Overloads? Generics? Separate methods? These are the design calls you'd make
  on the Duo SDK daily
- **Demoable**: you can show it working in an interview and talk about every
  decision

This one project covers points 1–5 below. Spend ~1 week on it.

---

## Phase 1: Monorepo + Package Fundamentals (Days 1–2)

### Learn

- **pnpm workspaces**: read the pnpm docs on workspaces. Understand
  `pnpm-workspace.yaml`, how `workspace:*` protocol works for local deps.
- **package.json anatomy for a published package**: `name`, `version`, `main`,
  `module`, `types`, `exports`, `files`, `sideEffects`. The `exports` field is
  the modern way — understand conditional exports (`import` vs `require` vs
  `types`).
- **tsconfig project references**: `composite: true`, `references`, and how
  `tsBuildInfoFile` enables incremental builds across packages.

### Do

1. `mkdir anthropic-sdk && cd anthropic-sdk && pnpm init`
2. Create `pnpm-workspace.yaml` pointing at `packages/*`
3. Create `packages/core` with its own `package.json` and `tsconfig.json`
4. Define the core types in `core` — `Message`, `MessageCreateParams`,
   `MessageResponse`, `ContentBlock`, `Role`. Export them.
5. Create `packages/node` with its own `package.json`. Import the types from
   `@anthropic-sdk/core` using `workspace:*`.
6. Make sure `pnpm install` links them, `tsc --build` compiles across packages.

### Checkpoint

You should be able to explain: what a workspace is, how packages reference each
other locally, and what happens at publish time (the `workspace:*` protocol gets
replaced with the actual version).

---

## Phase 2: ESM vs CommonJS (Days 2–3)

### Learn

- **`"type": "module"` in package.json**: what it does to `.js` file
  interpretation, why you need `.cjs` extension for CommonJS in an ESM package.
- **Module resolution**: Node's algorithm for ESM (`import`) vs CJS (`require`).
  Why `exports` map in package.json is the modern solution.
- **Dual publishing**: shipping both ESM and CJS from a single source. The
  `exports` field with `"import"` and `"require"` conditions.
- **`moduleResolution: "bundler"` vs `"node16"`** in tsconfig — what each
  expects and why it matters for a library.

### Do

1. Set up `tsup` in `packages/core` to output both ESM and CJS from the same
   source. (tsup is what many real SDKs use — worth knowing even if you could
   do it with raw tsc.)
2. Set up the `exports` field in `packages/core/package.json`:
   ```json
   "exports": {
     ".": {
       "import": "./dist/index.mjs",
       "require": "./dist/index.cjs",
       "types": "./dist/index.d.ts"
     }
   }
   ```
3. In `examples/cli`, write a CJS script that `require()`s `@anthropic-sdk/core`.
   Write an ESM script that `import`s it. Verify both resolve correctly.

### Checkpoint

You should be able to explain: why a published SDK might need to support both
module systems, what breaks when you get it wrong, and what the `exports` map
does.

---

## Phase 3: Isomorphic Code + Platform Adapters (Days 3–4)

### Learn

- **What differs between Node and browser**: `fs`, `path`, `crypto`
  (Node.js `crypto` vs Web Crypto API), `fetch` (now in Node 18+ but with
  differences), streams (Node streams vs Web Streams), `process.env` vs nothing.
- **The adapter pattern for platform isolation**: define an interface in `core`,
  implement it in platform-specific packages, inject at initialization.
- **Dependency injection vs conditional imports**: why conditional `import()`
  based on environment is fragile; why injecting an adapter is cleaner for SDK
  consumers.

### Do

1. Define adapter interfaces in `core`:
   ```typescript
   export interface HttpAdapter {
     fetch(url: string, init: RequestInit): Promise<Response>;
     createStream(response: Response): AsyncIterable<string>;
   }

   export interface AuthAdapter {
     getHeaders(): Record<string, string>;
   }
   ```
2. Implement `NodeHttpAdapter` in `packages/node` — uses Node's native `fetch`,
   reads API key from `process.env.ANTHROPIC_API_KEY`, streams via Node's
   `ReadableStream`.
3. Implement `BrowserHttpAdapter` in `packages/browser` — uses browser `fetch`,
   takes API key as constructor arg (never from env), streams via browser
   `ReadableStream` / SSE with `EventSource` or manual parsing.
4. `core` exports a `createClient(http: HttpAdapter, auth: AuthAdapter)` — it
   builds requests, parses responses, handles the SSE protocol for streaming,
   but never imports platform-specific code.
5. Build `examples/cli` — a Node script that sends a prompt and prints the
   streamed response token by token. Build `examples/web` — a tiny Vite app
   with a chat input that streams the response into the page.

### Checkpoint

You should be able to explain: why the Duo SDK needs this pattern (it runs in
VS Code extensions via Node AND in GitLab.com's web UI via the browser), and
how adapters "at the edges" keep the core portable. This maps directly to the
JD's "isolate platform-specific behavior in adapters at the edges."

---

## Phase 4: Semver, Changelogs, and API Deprecation (Day 5)

### Learn

- **Semantic versioning for a library**: MAJOR (breaking), MINOR (additive),
  PATCH (fix). What counts as a breaking change in a public API:
  - Removing or renaming an exported function/type
  - Changing a function's parameter types or return type
  - Changing default behavior
  - Dropping support for a Node version
- **Deprecation paths**: how to deprecate without breaking — mark old API with
  `@deprecated` JSDoc, keep it working for at least one minor release, document
  the migration in the changelog, remove in the next major.
- **Changesets** (the tool): a popular way to manage versioning and changelogs
  in monorepos. `@changesets/cli` — each PR adds a changeset file describing
  the change and its semver bump, then `changeset version` applies them all.

### Do

1. Install `@changesets/cli` in your monorepo root.
2. `pnpm changeset init`
3. Add a `countTokens()` method to the core client. Run `pnpm changeset` to
   create a changeset (minor bump). Run `pnpm changeset version` to see it
   update `package.json` and `CHANGELOG.md`.
4. Now simulate a breaking change: rename `createClient()` to `createAnthropic()`.
   Deprecate the old name first (keep `createClient` as a wrapper with
   `@deprecated` JSDoc), publish a minor. Then remove the wrapper and publish
   a major.

### Checkpoint

You should be able to answer: "You need to change a public API method's
signature. Walk me through how you'd do it without breaking consumers." The
answer: deprecate the old signature in a minor release, add the new one
alongside it, document the migration, remove the old one in the next major.

---

## Phase 5: Bundle Size and Tree-Shaking (Day 5–6)

### Learn

- **Tree-shaking**: how bundlers (Webpack, Rollup, Vite/esbuild) eliminate
  unused exports. It only works with ESM static `import/export` — CJS
  `require()` is dynamic and can't be statically analyzed.
- **What breaks tree-shaking**:
  - Barrel files (`index.ts` that re-exports everything) — can prevent
    fine-grained elimination
  - Side effects in module scope (code that runs on import)
  - `"sideEffects": false` in package.json tells bundlers it's safe to prune
- **Measuring bundle impact**: `bundlephobia.com` for published packages,
  `source-map-explorer` or `vite-bundle-visualizer` locally.

### Do

1. Add `"sideEffects": false` to `@anthropic-sdk/core`'s package.json.
2. In `examples/web`, import only `createClient` from `core` (not the full
   barrel export). Build with Vite. Check the output — unused type-related
   runtime code and helper functions should be eliminated.
3. Now change the import to `import * from '@anthropic-sdk/core'`. Rebuild.
   Compare sizes.
4. Run `vite-bundle-visualizer` to see what's in the bundle — note how the
   Node adapter should NOT appear in the browser bundle.

### Checkpoint

You should be able to explain: why an SDK consumed in the browser (like Duo
Chat on GitLab.com) cares about bundle size, what `sideEffects: false` does,
and how barrel exports can hurt.

---

## Phase 6: Credential Handling Patterns (Day 6–7)

### Learn

You already built the `AuthAdapter` interface in Phase 3. Now understand *why*
the patterns differ, and connect it to how the Duo SDK would handle the same
problem.

- **Bearer tokens**: stateless, sent in `Authorization` header, common in API
  calls from Node/CLI. Your Anthropic SDK uses this: `x-api-key` header. In
  the Duo SDK, VS Code extensions would use a PAT or OAuth token the same way.
- **Session cookies**: browser-managed, sent automatically with same-origin
  requests. Duo Chat on GitLab.com uses this — the user is already logged into
  GitLab, so cookies ride along.
- **CSRF protection**: why session cookies need it (browser sends them
  automatically, so a malicious page can forge requests). CSRF tokens in headers
  or form fields. Why bearer tokens and API keys don't need CSRF protection
  (they're not sent automatically).
- **The SDK pattern**: your `AuthAdapter` already abstracts this. The Node
  adapter reads from env and sets headers. The browser adapter takes an explicit
  key (or in GitLab's case, relies on cookies + CSRF). Same interface, different
  credential mechanics.

### Do

1. Extend your browser adapter's `AuthAdapter` to accept an optional CSRF
   token and include it as an `X-CSRF-Token` header. This mirrors what Duo Chat
   would need.
2. Write a test that verifies: Node adapter sets `x-api-key`, browser adapter
   sets `X-CSRF-Token` when provided.

### Checkpoint

You should be able to answer: "The SDK runs in VS Code and in the browser. How
does authentication differ?" Bearer token / API key injected via header in Node;
session cookie + CSRF token in browser. The SDK abstracts this behind a
credential adapter so consumers don't think about it.

---

## Phase 7: Vue 3 Basics (Day 7)

### Learn

Don't go deep. The JD explicitly accepts React experience. You just need to
understand the correspondence so you can discuss it.

| React               | Vue 3 Composition API  |
|----------------------|------------------------|
| `useState`           | `ref()` / `reactive()` |
| `useEffect`          | `watch()` / `watchEffect()` / `onMounted()` |
| `useMemo`            | `computed()`           |
| `useContext`          | `provide()` / `inject()` |
| JSX                  | Templates (or JSX, Vue supports both) |
| Component as function | `<script setup>` SFC  |

### Do

1. Scaffold a tiny Vue 3 app: `pnpm create vue@latest`
2. Build a `<ChatBox>` component that uses `ref` (message input, response text),
   `computed` (character count, loading state), `watch` (auto-scroll on new
   tokens), and `onMounted` (initialize the SDK client).
3. Wire it to your Anthropic SDK's browser adapter — type a message, stream the
   response into the component. This is the same integration path a Duo Chat
   Vue component would use with the Duo SDK.

### Checkpoint

You should be able to say: "I haven't shipped Vue in production, but I
understand the Composition API's model — it's reactive refs rather than
re-renders, and `<script setup>` SFCs are the equivalent of function
components. I'd be productive quickly."

---

## Interview Talking Points

After completing the project, you should be ready for these questions:

**"How would you design an SDK that works in both Node and the browser?"**
→ Isomorphic core with platform adapters injected at the edges. Core defines
interfaces, never imports platform-specific modules. Consumers pick their
adapter.

**"Walk us through publishing a breaking change."**
→ Deprecate in minor, document migration, remove in next major. Changesets for
versioning. Semver is a contract with consumers.

**"How do you keep bundle size small for browser consumers?"**
→ ESM for tree-shaking, `sideEffects: false`, avoid barrel re-exports,
measure with bundle analysis tooling.

**"How does auth work differently across your SDK's platforms?"**
→ Bearer tokens in Node (explicit header), session cookies + CSRF in browser
(automatic but need protection). Abstract behind a credential adapter.

**"What's your experience with Vue?"**
→ Honest: production React, studied Vue 3 Composition API, understand the
reactive model vs React's re-render model. Ready to contribute quickly.

**"Tell me about designing APIs other engineers depend on."**
→ SnapLogic typed event system: generated from the data model via codegen,
consumed across Python/Jinja/JavaScript. Versioned technical proposals for
design decisions. Reusable Web Components with stable public interfaces.

---

## Resources

- pnpm workspaces: https://pnpm.io/workspaces
- Node.js packages docs (exports, imports): https://nodejs.org/api/packages.html
- tsup (simple TS library bundler): https://tsup.egoist.dev/
- Changesets: https://github.com/changesets/changesets
- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- "The Modern Guide to Packaging Your JavaScript Library" (2024 blog post by
  the Vite team — search for it, it's excellent on exports/ESM/CJS)
