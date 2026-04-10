---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/midnight/contract-service.ts
  - lib/api/polls-handler.ts
  - lib/api/indexer-handler.ts
  - lib/queries/use-create-poll.ts
  - src/vite-env.d.ts
  - Dockerfile
  - docker-compose.yml
  - fly.toml
  - scripts/deploy-poll.mjs
autonomous: true
requirements: []
must_haves:
  truths:
    - "No code references VITE_POLL_CONTRACT_ADDRESS env var"
    - "All contract address reads come from deployment.json"
  artifacts:
    - path: lib/midnight/contract-service.ts
      provides: getContractAddress() reads from deployment.json
      contains: "contractAddress"
    - path: lib/api/polls-handler.ts
      provides: CONTRACT_ADDRESS from deployment.json
      contains: "contractAddress"
    - path: lib/api/indexer-handler.ts
      provides: DEFAULT_CONTRACT_ADDRESS from deployment.json
      contains: "contractAddress"
  key_links:
    - from: contract-service.ts
      to: deployment.json
      via: "import + getContractAddress()"
    - from: polls-handler.ts
      to: deployment.json
      via: "import at top level"
    - from: indexer-handler.ts
      to: deployment.json
      via: "import at top level"
---

<objective>
Remove VITE_POLL_CONTRACT_ADDRESS env var entirely and read the contract address exclusively from deployment.json (which is already deployed and contains contractAddress).
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@deployment.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace all VITE_POLL_CONTRACT_ADDRESS reads with deployment.json imports</name>
  <files>lib/midnight/contract-service.ts, lib/api/polls-handler.ts, lib/api/indexer-handler.ts, lib/queries/use-create-poll.ts, src/vite-env.d.ts, Dockerfile, docker-compose.yml, fly.toml, scripts/deploy-poll.mjs</files>
  <action>
Update all files to read the contract address from deployment.json instead of VITE_POLL_CONTRACT_ADDRESS env var.

**1. lib/midnight/contract-service.ts** — Replace getContractAddress():
- Add import at top: `import deployment from "@/deployment.json";`
- Update getContractAddress() to: `return deployment.contractAddress ?? null;`
- Update JSDoc to mention deployment.json instead of env var

**2. lib/api/polls-handler.ts** — Replace CONTRACT_ADDRESS:
- Add import at top: `import deployment from "@/deployment.json";`
- Replace line 26-27 with: `const CONTRACT_ADDRESS = deployment.contractAddress ?? "";`
- Update error message on line 54 to: "contract address not found in deployment.json"

**3. lib/api/indexer-handler.ts** — Replace DEFAULT_CONTRACT_ADDRESS:
- Add import at top: `import deployment from "@/deployment.json";`
- Replace line 30-31 with: `const DEFAULT_CONTRACT_ADDRESS = deployment.contractAddress ?? "";`
- Update error message on line 87 to mention deployment.json

**4. lib/queries/use-create-poll.ts** — Update error message:
- Line 88: change "VITE_POLL_CONTRACT_ADDRESS not configured" to "contract address not found in deployment.json"

**5. src/vite-env.d.ts** — Remove VITE_POLL_CONTRACT_ADDRESS:
- Remove line 4 (the VITE_POLL_CONTRACT_ADDRESS readonly property)
- Keep the file minimal with just the vite/client reference

**6. Dockerfile** — Remove VITE_POLL_CONTRACT_ADDRESS build arg and ENV:
- Remove lines 14-16 (ARG and ENV VITE_POLL_CONTRACT_ADDRESS)

**7. docker-compose.yml** — Remove VITE_POLL_CONTRACT_ADDRESS build arg:
- Remove line 12 (VITE_POLL_CONTRACT_ADDRESS arg under build.args)

**8. fly.toml** — Remove VITE_POLL_CONTRACT_ADDRESS:
- Remove line 12 (VITE_POLL_CONTRACT_ADDRESS in [build.args])
- Update line 3 comment: remove VITE_POLL_CONTRACT_ADDRESS from the secrets list
- Remove any VITE_POLL_CONTRACT_ADDRESS reference from the env section if present

**9. scripts/deploy-poll.mjs** — Update console output:
- Line 623: Change `VITE_POLL_CONTRACT_ADDRESS=${contractAddress}` to `Contract address saved to deployment.json`
- Line 21 comment: Update to mention deployment.json instead of .env.local
</action>
  <verify>
<automated>grep -r "VITE_POLL_CONTRACT_ADDRESS" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.yml" --include="*.toml" --include="Dockerfile" . planning/ 2>/dev/null | grep -v "node_modules" | grep -v "SUMMARY\|PLAN\|RESEARCH\|CONTEXT\|VERIFICATION\|debug\|ROADMAP"</automated>
  </verify>
  <done>VITE_POLL_CONTRACT_ADDRESS env var removed from all source files, config files, and deployment configs. All contract address reads come from deployment.json.</done>
</task>

</tasks>

<verification>
- `grep -r "VITE_POLL_CONTRACT_ADDRESS" lib/ src/ scripts/ server.ts 2>/dev/null` returns no matches
- `grep "deployment.json" lib/midnight/contract-service.ts lib/api/polls-handler.ts lib/api/indexer-handler.ts` returns 3 matches
- `grep "contractAddress" deployment.json` returns the address
- `bun run lint` passes
</verification>

<success_criteria>
- Zero references to VITE_POLL_CONTRACT_ADDRESS in any source, config, or deployment file
- All 3 API/contract files import from deployment.json
- Error messages updated to mention deployment.json
- Dockerfile, docker-compose.yml, fly.toml cleaned of the env var
</success_criteria>

<output>
After completion, create `.planning/quick/260410-hvl-remove-vite-poll-contract-address-env-va/260410-hvl-SUMMARY.md`
</output>
