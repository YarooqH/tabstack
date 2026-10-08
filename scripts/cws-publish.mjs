#!/usr/bin/env node
/**
 * Chrome Web Store publisher (API v2, no dependencies).
 *
 *   node scripts/cws-publish.mjs check            Compares manifest.json with the store version
 *   node scripts/cws-publish.mjs publish <zip>    Uploads the zip and submits it for review
 *
 * Environment:
 *   CWS_PUBLISHER_ID, CWS_EXTENSION_ID           Required
 *   CWS_SERVICE_ACCOUNT_JSON                     Service account key (preferred), or
 *   CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN   OAuth client + refresh token
 *   CWS_PUBLISH_TYPE                             DEFAULT_PUBLISH (default) or STAGED_PUBLISH
 *   CWS_CANCEL_PENDING                           "true" to cancel an older submission still in review
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const API = 'https://chromewebstore.googleapis.com';
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;

class PublishError extends Error {}

// Throws instead of process.exit() so open fetch sockets close before Node exits
function fail(message) {
  throw new PublishError(message);
}

function setOutput(name, value) {
  if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function summary(markdown) {
  console.log(markdown);
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

/** Compares dotted Chrome versions (1-4 integer parts). Returns -1, 0 or 1. */
function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

const base64url = (input) => Buffer.from(input).toString('base64url');

async function getAccessToken() {
  let body;

  if (env.CWS_SERVICE_ACCOUNT_JSON) {
    let key;
    try {
      key = JSON.parse(env.CWS_SERVICE_ACCOUNT_JSON);
    } catch {
      fail('CWS_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify({
      iss: key.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600
    }))}`;
    const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
    body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`
    });
  } else if (env.CWS_CLIENT_ID && env.CWS_CLIENT_SECRET && env.CWS_REFRESH_TOKEN) {
    body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.CWS_CLIENT_ID,
      client_secret: env.CWS_CLIENT_SECRET,
      refresh_token: env.CWS_REFRESH_TOKEN
    });
  } else {
    fail('No credentials: set CWS_SERVICE_ACCOUNT_JSON, or CWS_CLIENT_ID + CWS_CLIENT_SECRET + CWS_REFRESH_TOKEN');
  }

  const res = await fetch(TOKEN_URL, { method: 'POST', body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    fail(`Could not get an access token (${res.status}): ${json.error_description || json.error || 'unknown error'}`);
  }
  return json.access_token;
}

async function api(token, method, url, { body, contentType } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(contentType ? { 'Content-Type': contentType } : {})
    },
    body
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const detail = json.error?.message || json.raw || text;
    fail(`${method} ${url.replace(API, '')} failed (${res.status}): ${detail}`);
  }
  return json;
}

function itemPath() {
  if (!env.CWS_PUBLISHER_ID || !env.CWS_EXTENSION_ID) fail('CWS_PUBLISHER_ID and CWS_EXTENSION_ID are required');
  return `publishers/${env.CWS_PUBLISHER_ID}/items/${env.CWS_EXTENSION_ID}`;
}

function revisionVersion(revision) {
  return revision?.distributionChannels?.[0]?.crxVersion || null;
}

async function fetchStatus(token) {
  return api(token, 'GET', `${API}/v2/${itemPath()}:fetchStatus`);
}

/**
 * Decides whether the local manifest version should be submitted
 */
function evaluate(status, localVersion) {
  const published = revisionVersion(status.publishedItemRevisionStatus);
  const submitted = revisionVersion(status.submittedItemRevisionStatus);
  const submittedState = status.submittedItemRevisionStatus?.state || null;

  if (status.takenDown) return { publish: false, reason: 'The item is taken down in the store; resolve it in the Developer Dashboard.', published, submitted, submittedState, error: true };
  if (published && compareVersions(localVersion, published) <= 0) {
    return { publish: false, reason: `v${localVersion} is not newer than the published v${published}. Bump "version" in manifest.json to ship.`, published, submitted, submittedState };
  }
  if (submitted && compareVersions(localVersion, submitted) <= 0 && ['PENDING_REVIEW', 'STAGED'].includes(submittedState)) {
    return { publish: false, reason: `v${submitted} is already submitted (${submittedState}).`, published, submitted, submittedState };
  }
  return { publish: true, reason: `v${localVersion} is newer than the store (published: ${published || 'none'}).`, published, submitted, submittedState };
}

async function check() {
  const localVersion = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).version;
  const token = await getAccessToken();
  const status = await fetchStatus(token);
  const result = evaluate(status, localVersion);

  setOutput('should_publish', String(result.publish));
  setOutput('version', localVersion);
  summary(`### Chrome Web Store check\n\n| | Version | State |\n|---|---|---|\n| manifest.json | ${localVersion} | |\n| Published | ${result.published || '—'} | ${status.publishedItemRevisionStatus?.state || '—'} |\n| Submitted | ${result.submitted || '—'} | ${result.submittedState || '—'} |\n\n${result.publish ? '🚀' : '⏭️'} ${result.reason}`);
  if (status.warned) console.log('::warning::The store item has an active policy warning. Check the Developer Dashboard.');
  if (result.error) fail(result.reason);
}

async function waitForUpload(token) {
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await fetchStatus(token);
    const state = status.lastAsyncUploadState;
    console.log(`Upload state: ${state}`);
    if (state === 'SUCCEEDED') return;
    if (state === 'FAILED' || state === 'NOT_FOUND') fail(`Upload processing ended with ${state}. Check the Developer Dashboard for details.`);
  }
  fail('Timed out waiting for the upload to finish processing');
}

async function publish(zipFile) {
  if (!zipFile || !fs.existsSync(zipFile)) fail(`Package not found: ${zipFile}`);
  const localVersion = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).version;
  const token = await getAccessToken();

  // Re-check right before uploading in case another run already shipped this version
  const status = await fetchStatus(token);
  const decision = evaluate(status, localVersion);
  if (!decision.publish) {
    summary(`⏭️ Skipped publish: ${decision.reason}`);
    if (decision.error) fail(decision.reason);
    return;
  }

  if (decision.submittedState === 'PENDING_REVIEW') {
    if (env.CWS_CANCEL_PENDING !== 'true') {
      fail(`v${decision.submitted} is still in review. Wait for it, or re-run with CWS_CANCEL_PENDING=true to replace it with v${localVersion}.`);
    }
    console.log(`Cancelling pending submission v${decision.submitted}`);
    await api(token, 'POST', `${API}/v2/${itemPath()}:cancelSubmission`);
  }

  console.log(`Uploading ${path.basename(zipFile)} (${fs.statSync(zipFile).size} bytes)`);
  const upload = await api(token, 'POST', `${API}/upload/v2/${itemPath()}:upload`, {
    body: fs.readFileSync(zipFile),
    contentType: 'application/zip'
  });
  console.log(`Upload response: ${JSON.stringify(upload)}`);

  if (upload.uploadState === 'IN_PROGRESS' || upload.uploadState === 'UPLOAD_IN_PROGRESS') {
    await waitForUpload(token);
  } else if (upload.uploadState !== 'SUCCEEDED') {
    fail(`Upload failed with state ${upload.uploadState}: ${JSON.stringify(upload)}`);
  }

  const publishType = env.CWS_PUBLISH_TYPE || 'DEFAULT_PUBLISH';
  const result = await api(token, 'POST', `${API}/v2/${itemPath()}:publish`, {
    body: JSON.stringify({ publishType }),
    contentType: 'application/json'
  });

  setOutput('submitted_version', localVersion);
  setOutput('state', result.state || '');
  const warnings = (result.warningInfo?.warnings || []).map(w => `- ${w.reason}: ${w.description}`).join('\n');
  summary(`### Submitted v${localVersion} to the Chrome Web Store\n\nState: \`${result.state}\` (${publishType}). Google reviews the update before it reaches users.${warnings ? `\n\nWarnings:\n${warnings}` : ''}`);
}

const [command, arg] = process.argv.slice(2);
try {
  if (command === 'check') {
    await check();
  } else if (command === 'publish') {
    await publish(arg);
  } else {
    fail('Usage: cws-publish.mjs check | publish <zip>');
  }
} catch (err) {
  console.error(`::error::${err instanceof PublishError ? err.message : err.stack}`);
  process.exitCode = 1;
}
