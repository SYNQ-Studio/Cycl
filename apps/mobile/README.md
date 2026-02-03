# Mobile App (Expo)

Manual-first MVP scaffold for the Credit Card Payment Planner.

## Run

1. Install dependencies: `pnpm install`
2. Start the app: `pnpm --filter @ccpp/mobile start`

## Build (prebuild)

`pnpm --filter @ccpp/mobile build`

This runs `expo prebuild --no-install` to generate native iOS/Android projects.

## iOS native build (`expo run:ios`)

**Requires a path without spaces.** If the repo (or any parent folder) has spaces in the path (e.g. `Credit Card Payment Planner`), the Xcode build will fail with:

```text
PhaseScriptExecution [CP-User] Generate app.config for prebuilt Constants.manifest ... (in target 'EXConstants')
```

Expo/React Native build scripts often do not quote paths; spaces break the script.

**Best-practice fixes:**

1. **Move the repo to a path without spaces** (recommended)  
   Example: clone or move the project to something like:

   - `~/dev/CreditCardPaymentPlanner`
   - `~/dev/credit-card-payment-planner`  
     Then run `pnpm install`, `pnpm --filter @ccpp/mobile build`, and `pnpm --filter @ccpp/mobile ios` from the new path.

2. **Use a symlink**  
   Create a symlink whose path has no spaces and build from there:
   ```bash
   ln -s "/Users/you/dev/Apps/PaymentCard Planner/Credit Card Payment Planner" ~/dev/CreditCardPaymentPlanner
   cd ~/dev/CreditCardPaymentPlanner
   pnpm install && pnpm --filter @ccpp/mobile ios
   ```
   Xcode will resolve the real path, but the build scripts are invoked with the symlink path (no spaces), which often fixes the failure.
