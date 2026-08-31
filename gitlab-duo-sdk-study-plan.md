 GitLab Duo Client SDK — Focused Study Plan

The goal: be able to speak intelligently about SDK design, packaging, and
isomorphic TypeScript in technical discussions. The fastest path is to build a
small SDK that exercises every concept the role cares about.

---

## The Project: Build an Agent Message SDK

Build an isomorphic TypeScript SDK that wraps the Anthropic Messages API. This
is the right level of complexity: it needs to work in Node (CLI tools, server
apps) and the browser (chat UIs), has real streaming to handle, real auth
differences per platform, and real API surface design decisions. You already
know the domain from using Claude Code daily, so you can focus on *how to
package it* rather than learning what the API does.

Structure:

```
agent-message-sdk/
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
├── tsconfig.shared.json
├── tsconfig.json       # root — references only, not a compilation target
└── pnpm-workspace.yaml
```

Scope: `@agent-message-sdk/*` across all packages.

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

## Phase 1: Monorepo + Package Fundamentals (Days 1–2) ✅

### Learn

- **pnpm workspaces**: `pnpm-workspace.yaml` defines which directories are
  workspace packages (not `package.json` — that's npm/yarn). `workspace:*`
  protocol links local packages; at publish time it's replaced with the actual
  version.
- **package.json anatomy for a published package**: `name` (scoped, e.g.
  `@agent-message-sdk/core`), `version`, `main` (entry point for consumers),
  `types` (TypeScript declaration entry), `exports` (modern replacement — Phase
  2). Without `main`, Node falls back to `index.js` in the package root.
- **tsconfig project references**: `composite: true` marks a package as a
  buildable project. `references` in each package's tsconfig declares its
  dependencies. The root `tsconfig.json` in `--build` mode should be a
  coordinator only — just `references`, no `extends`, no `outDir`, no
  compilation of its own.
- **`index.ts` as barrel file**: re-export everything consumers should be able
  to import. Anything not re-exported stays internal to the package. Types are
  erased at compile time, but consumers still need them re-exported to use them
  by name.

### Lessons learned

- **`lib` in tsconfig** restricts which built-in type definitions TypeScript
  includes. Setting `"lib": ["ES2022"]` explicitly excludes Node globals like
  `console` — they come from `@types/node`, which TypeScript only picks up
  automatically when `lib` isn't set (or when you add `"types": ["node"]` to
  `compilerOptions`).
- **`lib` vs `types` vs `@types/*`**: `lib` = built-in type defs shipped with
  TypeScript (ES features, DOM APIs). `types` = which `@types/*` packages to
  include from `node_modules`. `@types/node` = third-party type declarations
  for Node globals.
- **`target` vs `lib`**: `target` controls what JS syntax tsc emits. `lib`
  controls what APIs TypeScript assumes exist at runtime. They're independent.
- **`outDir` must be inside `compilerOptions`**, not a top-level tsconfig key.
- **Root tsconfig in `--build` mode**: if the root tsconfig extends the shared
  config and has its own `outDir`, it acts as a compilation target — grabbing
  all `.ts` files and compiling them into a single output folder. Fix: make it
  references-only.
- **`tsc` doesn't clean up** previous output. When changing `outDir`, manually
  delete stale `.js`/`.d.ts`/`.js.map` files.
- **pnpm strictness**: `pnpm install` must run from the repo root to resolve
  workspace links. Use `pnpm exec` instead of `npx` (which uses npm). Root dev
  dependencies need the `-w` flag.
- **`--filter`**: `pnpm --filter @agent-message-sdk/node run build` targets a
  single package. `--filter ...@agent-message-sdk/node` means "this package and
  all its dependencies" — builds core first, then node.

### Checkpoint

A workspace is a way to manage a group of JS/TS projects in a single repo.
Each project has its own dependencies but can share dependencies and reference
each other via `workspace:*`. `tsc --build` with `references` models the
dependency graph so packages compile in the right order. At publish time,
`workspace:*` is replaced with real version numbers.

---

## Phase 2: ESM vs CommonJS (Days 2–3) ✅

### Learn

- **`"type": "module"` in package.json**: what it does to `.js` file
  interpretation, why you need `.cjs` extension for CommonJS in an ESM package.
- **Module resolution**: Node's algorithm for ESM (`import`) vs CJS (`require`).
  Why `exports` map in package.json is the modern solution.
  - ```json
     "exports": {
        ".": {
          "import": "./dist/mjs/index.js",
          "require": "./dist/cjs/index.js",
          "types": "./dist/index.d.ts"
    ```
    We need to define were our exports will end up

- **Dual publishing**: shipping both ESM and CJS from a single source. The
  `exports` field with `"import"` and `"require"` conditions.
   - this involves creating a second tsconfig with its own declaration to cjs. The problem is that typescript cannot modify the file extension. the common js modules therefor need their own `package.json` to understand how ro resolve modules. either the file extension or the package json needs to be added _post build_ via some kind of script. This is where larger projects reach for some kind of bundler, like `tsdown`, to simplify their workflows.
- **`moduleResolution: "bundler"` vs `"node16"`** in tsconfig — what each
  expects and why it matters for a library.

### Do

1. Understand the problem first: use `tsc` with two different `module` settings
   to produce ESM and CJS output. Look at the emitted JavaScript — what
   actually differs? `import/export` vs `require/module.exports`.
2. Create `examples/cli` — a small script that imports from
   `@agent-message-sdk/core` and does something simple (create a message, print
   it). This simulates an external consumer of your SDK. Write both a CJS
   version (`require()`) and an ESM version (`import`). See what breaks when
   the format doesn't match.
3. Set up the `exports` field in `packages/core/package.json` to map `"import"`
   and `"require"` conditions to the correct output files. `"types"` should
   come first in each condition block (TypeScript resolves top-down).
4. Once you understand the mechanics, decide whether a tool like tsdown is
   worth adding. tsdown (successor to tsup, from the rolldown project) produces
   both formats from one config with correct file extensions — convenient, but
   you should understand what it's abstracting before reaching for it.

### Lessons learned

- **tsconfig `module` and `package.json` `type` must agree.** These are two
  independent systems with no shared config. `tsc` uses `module` to decide what
  syntax to emit. Node uses `type` to decide how to interpret `.js` files. When
  they disagree, you get cryptic runtime errors (e.g., CJS syntax in a file
  Node treats as ESM because of `"type": "module"`).
- **`tsc` cannot control output file extensions.** It always outputs `.js`. You
  can't get `.mjs`/`.cjs` from `tsc` alone — this matters because file
  extensions override `"type"` in `package.json` and are the cleanest way to
  disambiguate formats. To get `.mjs`/`.cjs` you need either a build tool
  (tsdown) or post-build scripts.
- **Dual output with raw `tsc` means two tsconfigs, two build passes, two
  output directories.** Each tsconfig overrides `module` and `outDir` from the
  shared config. The root `tsconfig.json` needs explicit references to both
  (no wildcard support). This gets tedious fast with multiple packages.
- **The `exports` map routes consumers to the right format**, but the files it
  points to must actually be interpretable as that format. A `.js` file with CJS
  content inside a `"type": "module"` package will fail — Node looks at the
  nearest `package.json` `type`, not the file content. Workarounds: `.cjs`
  extensions (needs a build tool), or a nested `package.json` with
  `"type": "commonjs"` inside the CJS output directory (a hack, but used by
  real SDKs).
- **`exports` must nest under `"."`** (the package root entry point). `"types"`
  should come first in each condition block — TypeScript resolves top-down.
- **`tsconfig.shared.json` `"module": "preserve"`** passes import/export syntax
  through unchanged — useful when a downstream bundler handles module
  transformation, but useless for seeing the ESM vs CJS difference.
- **Breakage scenarios observed:**
  - CJS output + ESM consumer → named imports fail
  - ESM output + CJS consumer → `require()` can't parse `export` syntax
  - tsconfig/package.json disagreement → Node interprets the file wrong
- **Bottom line:** managing build targets via `tsc` and `package.json` gets
  complex fast. You either end up building custom scripts or using a
  comprehensive tool like tsdown. The value of the tool is clear once you've
  hit the friction firsthand.

### Checkpoint

You should be able to explain: why a published SDK might need to support both
module systems, what breaks when you get it wrong, what the `exports` map does,
and what the actual differences in emitted JS look like between ESM and CJS.
The sane default for a modern SDK is ESM-first with an `exports` map that
optionally adds a CJS fallback.

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
- **Changesets** (optional tool): `@changesets/cli` manages versioning and
  changelogs in monorepos. Worth understanding the workflow (each PR adds a
  changeset describing the change and its semver bump), but understand the
  semver concepts before reaching for the tool.

### Do

1. Simulate a deprecation cycle: add a new method, deprecate an existing one
   with `@deprecated` JSDoc, then remove the old one. Think about what version
   bumps each step requires.
2. Optionally install `@changesets/cli` and run through its workflow to see how
   automated changelog generation works.

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
- **Measuring bundle impact**: `source-map-explorer` or
  `vite-bundle-visualizer` locally.

### Do

1. Add `"sideEffects": false` to `@agent-message-sdk/core`'s package.json.
2. In `examples/web`, import only `createClient` from `core` (not the full
   barrel export). Build with Vite. Check the output — unused runtime code
   and helper functions should be eliminated.
3. Now change the import to `import * from '@agent-message-sdk/core'`. Rebuild.
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
  calls from Node/CLI. Your SDK uses this: `x-api-key` header. In the Duo SDK,
  VS Code extensions would use a PAT or OAuth token the same way.
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
3. Wire it to your SDK's browser adapter — type a message, stream the response
   into the component. This is the same integration path a Duo Chat Vue
   component would use with the Duo SDK.

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
→ Deprecate in minor, document migration, remove in next major. Semver is a
contract with consumers.

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
- pnpm filtering: https://pnpm.io/filtering
- Node.js packages docs (exports, imports): https://nodejs.org/api/packages.html
- npm workspaces docs (concepts transfer): https://docs.npmjs.com/cli/using-npm/workspaces
- tsup (simple TS library bundler): https://tsup.egoist.dev/
- Changesets: https://github.com/changesets/changesets
- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- "The Modern Guide to Packaging Your JavaScript Library" (2024 blog post by
  the Vite team — search for it, it's excellent on exports/ESM/CJS)
