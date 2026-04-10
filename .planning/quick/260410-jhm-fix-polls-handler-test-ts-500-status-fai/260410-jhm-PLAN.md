---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/api/polls-handler.test.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Test 'should return 503 when contract address not configured' passes"
  artifacts:
    - path: "tests/api/polls-handler.test.ts"
      provides: "Fixed mock for fetchLatestBlock"
  key_links:
    - from: "tests/api/polls-handler.test.ts"
      to: "lib/api/polls-handler.ts"
      via: "vi.mock import"
---

<objective>
Fix the failing test "should return 503 when contract address not configured" by adding a default mock return value to `fetchLatestBlock`.
</objective>

<context>
The issue: `fetchLatestBlock: vi.fn()` at line 12 has no mock implementation. When called, it returns `undefined`. Then at line 66 of polls-handler.ts: `latestBlock.height` throws `TypeError: Cannot read properties of undefined (reading 'height')`, causing the 500 catch block to trigger.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add mockResolvedValue to fetchLatestBlock</name>
  <files>tests/api/polls-handler.test.ts</files>
  <action>
    In the vi.mock('@/lib/midnight/indexer-client', ...) block at line 11, change:
    
    `fetchLatestBlock: vi.fn(),`
    
    to:
    
    `fetchLatestBlock: vi.fn().mockResolvedValue({ height: 0 }),`
    
    This ensures fetchLatestBlock returns a valid object with a `height` property when called, preventing the TypeError that causes the 500 response.
  </action>
  <verify>
    <automated>cd /home/hkedia/Code/ourobeam/shadow-poll && bun test tests/api/polls-handler.test.ts --filter="should return 503"</automated>
  </verify>
  <done>Test "should return 503 when contract address not configured" passes with status 200 or 503</done>
</task>

</tasks>

<verification>
```bash
bun test tests/api/polls-handler.test.ts
```
</verification>

<success_criteria>
All polls-handler tests pass.
</success_criteria>

<output>
After completion, create `.planning/quick/260410-jhm-fix-polls-handler-test-ts-500-status-fai/260410-jhm-SUMMARY.md`
</output>
