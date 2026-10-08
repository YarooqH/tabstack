# Publishing to the Chrome Web Store

Merges to `master` that touch the extension (`manifest.json`, `src/`, `icons/`) are uploaded to the Chrome Web Store and submitted for review automatically by [`.github/workflows/extension.yml`](../.github/workflows/extension.yml). It uses the [Chrome Web Store API v2](https://developer.chrome.com/docs/webstore/using-api). The v1 API stops working on October 15, 2026.

## How a release flows

1. **Open a PR** that changes the extension and bumps `"version"` in `manifest.json`. The PR check fails if extension files changed but the version isn't higher than `master`'s.
2. **CI validates and packages** the extension: manifest sanity checks, a syntax check of every script, and a zip of `manifest.json`, `src/` and `icons/` attached to the run as an artifact.
3. **Merge.** The publish job compares the manifest version with the store:
   - newer than the published and pending versions: uploads the zip and submits it for review
   - already published or already in review: skips, with the reason in the job summary
4. **Google reviews the update.** It goes live automatically when approved (usually within a few days).
5. A **GitHub Release** `vX.Y.Z` is created with the submitted zip attached.

Merges that only touch the landing page, docs or README never publish. The landing page has its own workflow (`deploy.yml`).

## One-time setup

You need your **Publisher ID** from the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) under **Account → Publisher settings**. The publishing Google account must have 2-step verification turned on.

Then pick **one** of the two auth methods below.

### Option A: Service account (recommended)

Service account keys don't expire, and they aren't tied to your personal Google login.

1. In the [Google Cloud Console](https://console.cloud.google.com), create or pick a project and **enable the "Chrome Web Store API"**.
2. Go to **IAM & Admin → Service accounts** and create a service account. It doesn't need any IAM roles.
3. Open the service account, go to **Keys → Add key → Create new key → JSON**, and download the file.
4. In the Chrome Web Store [Developer Dashboard](https://chrome.google.com/webstore/devconsole), go to **Account**, find the service account section, and add the service account's email address. Only one service account can be added per publisher.
5. Add the secrets to the `chrome-web-store` environment (the commands are under [Add the GitHub secrets](#add-the-github-secrets)):
   - `CWS_PUBLISHER_ID`
   - `CWS_SERVICE_ACCOUNT_JSON`: the full contents of the JSON key file

If your Google Cloud organization blocks service account key creation, use Option B.

### Option B: OAuth client + refresh token

1. In the Cloud Console, **enable the "Chrome Web Store API"**.
2. Configure the **OAuth consent screen** (External), then **publish the app to "In production"**. While the app is in "Testing", refresh tokens expire after 7 days and the pipeline starts failing.
3. Create an **OAuth client ID** of type *Web application* with the authorized redirect URI `https://developers.google.com/oauthplayground`.
4. Open the [OAuth Playground](https://developers.google.com/oauthplayground). Click the gear icon, tick **Use your own OAuth credentials**, and enter your client ID and secret. Authorize the scope `https://www.googleapis.com/auth/chromewebstore` with the publisher account, then click **Exchange authorization code for tokens** and copy the **refresh token**.
5. Add the secrets to the `chrome-web-store` environment:
   - `CWS_PUBLISHER_ID`
   - `CWS_CLIENT_ID`
   - `CWS_CLIENT_SECRET`
   - `CWS_REFRESH_TOKEN`

### Add the GitHub secrets

You can add them in **Settings → Environments → New environment → `chrome-web-store`**, or with the GitHub CLI:

```bash
gh secret set CWS_PUBLISHER_ID --env chrome-web-store --repo YarooqH/tabstack
```

```bash
gh secret set CWS_SERVICE_ACCOUNT_JSON --env chrome-web-store --repo YarooqH/tabstack < path/to/service-account-key.json
```

Optional:
- **Required reviewers** on the `chrome-web-store` environment, to approve each store submission by hand before it runs.
- A repository **variable** `CWS_EXTENSION_ID` if the store item ID ever changes. It defaults to `pnjlcnpebjggdmkhbopnibjgechfbfjg`.

Until the secrets exist, the publish job skips with a warning instead of failing.

## Running it manually

**Actions → Extension Build & Chrome Web Store Publish → Run workflow** on `master` offers two options:

- **publish_type**: `STAGED_PUBLISH` holds the update after review approval until you click Publish in the dashboard. `DEFAULT_PUBLISH` (the default) goes live as soon as it's approved.
- **cancel_pending**: cancels an older version that is still in review and submits the current one instead. Without it, the job stops and tells you a submission is already pending.

## Local commands

```bash
node scripts/build-extension.mjs
```

This validates the extension and writes `dist/tabstack-<version>.zip`. It needs the `zip` CLI.

```bash
CWS_PUBLISHER_ID=... CWS_EXTENSION_ID=pnjlcnpebjggdmkhbopnibjgechfbfjg CWS_SERVICE_ACCOUNT_JSON="$(cat key.json)" node scripts/cws-publish.mjs check
```

This compares `manifest.json` with what's in the store and changes nothing.

## What the pipeline does not update

The API only uploads packages. Do these in the Developer Dashboard when they change:

- Store listing text, screenshots and promo images
- **Privacy practices**: permission justifications and data-usage disclosures. For example, a newly added permission such as `unlimitedStorage` needs a justification before review.
- Distribution and visibility settings
