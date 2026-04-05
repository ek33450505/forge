## Summary

-
-

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Performance improvement
- [ ] Refactor (no behavior change)
- [ ] Docs only
- [ ] Build / CI

## Changes

<!-- Describe what changed and why. Link any related issues with "Closes #N". -->

## Testing

<!-- How did you test this? Check all that apply. -->

- [ ] `npm run test` passes
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `cd src-tauri && cargo test` passes
- [ ] Tested manually in the running app

**Manual test steps:**

1.
2.
3.

## Screenshots

<!-- If your change affects the UI, include before/after screenshots. Delete this section if not applicable. -->

## Pre-Merge Checklist

- [ ] `npm run test` passes
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] `cd src-tauri && cargo test` passes
- [ ] No `unwrap()` calls added to IPC command handlers (`src-tauri/src/`)
- [ ] Zustand selectors are stable (no full-store selects in new component code)
- [ ] `CHANGELOG.md` updated for any user-visible change
- [ ] PR is focused on one logical change
