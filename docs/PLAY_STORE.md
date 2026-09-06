# Play Store production build (V1)

Offline V1 Android release config. Defaults used in this repo (change only if you own a different Play listing):

| Field | Value |
| --- | --- |
| App name | `Expense Tracker` |
| Android package | `com.dineshkumar.expensetracker` |
| iOS bundle id (later) | `com.dineshkumar.expensetracker` |
| EAS project slug | `expense-tracker` |
| Version | `1.0.0` |
| Android `versionCode` | `1` (from `apps/mobile/app.json`, `eas.json` `appVersionSource: local`) |

Ready-to-paste store listing, Data safety answers, screenshot shot list, and closed-testing checklist: [PLAY_LISTING.md](PLAY_LISTING.md). Privacy policy text: [privacy-policy.md](privacy-policy.md).

## One-time Expo / EAS setup

Do this on the machine that will start the first production build. Do **not** commit keystores, `credentials.json`, or Expo tokens.

1. Create or sign in to an [Expo](https://expo.dev) account.
2. From `apps/mobile`:

```bash
pnpm dlx eas-cli login
pnpm dlx eas-cli init
```

Link this app to the `expense-tracker` slug. `eas init` writes `extra.eas.projectId` into `app.json`. Commit that id when it appears; it is not a secret.

3. The first Android production build asks EAS to generate a keystore. Let EAS manage it.

`eas-cli` is not a repo dependency. Use `pnpm dlx eas-cli` if it is not installed globally.

## Build commands

From `apps/mobile`:

```bash
# Play Store Android App Bundle (.aab) — production profile
pnpm dlx eas-cli build -p android --profile production
```

Same command via package script (also uses `pnpm dlx eas-cli`):

```bash
pnpm run build:android
```

From the monorepo root:

```bash
pnpm --filter @expense-tracker/mobile build:android
```

Other profiles (not for Play upload):

```bash
# Sideloadable APK
pnpm dlx eas-cli build -p android --profile preview

# Dev client APK — needs expo-dev-client, which V1 does not install yet
pnpm dlx eas-cli build -p android --profile development
```

Do not start a paid EAS build until you are ready to use quota. After the job finishes, download the `.aab` from the Expo dashboard.

## Privacy URL

Play Console needs a public **HTTPS** privacy policy URL. Host [privacy-policy.md](privacy-policy.md) on the open web, then paste that URL into Play Console → App content → Privacy policy.

Ways to host it:

- **GitHub Pages** — enable Pages on this repo (for example Source: `/docs`). After it publishes, the page is typically `https://<github-user>.github.io/<repo>/privacy-policy` (or `privacy-policy.html` if you export HTML).
- **Notion** — publish the same text to the web and copy the public link.
- **Public gist** — paste the markdown, create a public gist, and use the gist's HTTPS URL.

The in-app Privacy screen (Settings → Privacy policy) shows the same V1 facts and does **not** load this URL. Replace `dinesh@example.com` (TODO-replace) before you publish if you want a real contact address.

## Store listing and closed testing

Paste copy and follow the tester/production checklist in [PLAY_LISTING.md](PLAY_LISTING.md). You still have to sign in to Expo, run the EAS production build, pay for a Play developer account, host the privacy URL, and upload the `.aab` yourself.
