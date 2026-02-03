# Development Notes

## 2026-02-03 — Mobile MVP bring-up

These notes document the fixes required to get the Expo prebuild app running on iOS in a monorepo with a workspace path containing spaces.

### Environment

- Node.js >= 20 required (engine-strict enforced).
- pnpm 9 used for installs.

### Critical Fixes Applied

1. **Expo entrypoint in monorepo**
   - Root cause: `expo/AppEntry` resolves `../../App` from the hoisted `node_modules` and fails in a workspace.
   - Fix: use `apps/mobile/index.ts` as the entrypoint and set `"main": "index.ts"` in `apps/mobile/package.json`.

2. **Metro module resolution**
   - Root cause: `disableHierarchicalLookup = true` blocks resolving `expo-modules-core` in pnpm layouts.
   - Fix: set `disableHierarchicalLookup = false` in `apps/mobile/metro.config.js`.

3. **Path with spaces breaks build scripts**
   - Root cause: unquoted script paths in Xcode/Pods scripts.
   - Fix: quote `EXConstants` script in `apps/mobile/ios/Podfile` post_install and quote the bundling script in `apps/mobile/ios/CreditCardPaymentPlanner.xcodeproj/project.pbxproj`.

4. **Expo SQLite API change**
   - Root cause: Expo SDK 54 uses `expo-sqlite` v16 which removes `SQLite.openDatabase`.
   - Fix: migrate to `openDatabaseAsync`, `runAsync`, `getAllAsync`, `getFirstAsync` in `apps/mobile/src/data`.

5. **Reanimated dependency**
   - Root cause: `react-native-reanimated` v4 requires `react-native-worklets`.
   - Fix: add `react-native-worklets` to `apps/mobile/package.json`.

6. **Solver build compatibility**
   - Root cause: stale dist output referenced `node:crypto` in React Native bundle.
   - Fix: rebuild solver after removing Node crypto usage; ensure Metro cache is cleared after rebuild.

### Build/Run Checklist

1. `pnpm install`
2. `pnpm --filter @ccpp/solver build`
3. `cd apps/mobile/ios && pod install`
4. `pnpm --filter @ccpp/mobile exec expo start -c`
5. `pnpm --filter @ccpp/mobile exec expo run:ios`

### Android Setup (macOS)

1. Install Java 17 (required by Gradle):
   - `brew install --cask temurin@17`
   - `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`
2. Configure Android SDK path:
   - Add `ANDROID_HOME=$HOME/Library/Android/sdk`
   - Or create `apps/mobile/android/local.properties` with:
     - `sdk.dir=/Users/<you>/Library/Android/sdk`
3. Run:
   - `pnpm --filter @ccpp/mobile exec expo run:android`
