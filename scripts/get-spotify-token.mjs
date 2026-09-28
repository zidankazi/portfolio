#!/usr/bin/env node
/** Reconnect Spotify: node scripts/get-spotify-token.mjs */
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
// Must match the Portfolio API app's registered redirect URI exactly.
const REDIRECT_URI = 'http://127.0.0.1:3000/callback';
const SCOPES = 'user-read-currently-playing user-read-recently-played';
const state = randomBytes(24).toString('hex');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local first.');
  process.exit(1);
}

let exchanging = false;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end('Not found');
    return;
  }
  if (url.searchParams.get('state') !== state) {
    res.writeHead(400).end('Invalid authorization state. Open the link printed in your terminal.');
    return;
  }
  const code = url.searchParams.get('code');
  if (!code || url.searchParams.has('error')) {
    res.writeHead(400).end('Spotify authorization was not completed. Try the link again.');
    return;
  }
  if (exchanging) {
    res.writeHead(409).end('Authorization is already being processed.');
    return;
  }
  exchanging = true;
  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.refresh_token) {
      throw new Error(`Spotify token exchange failed (HTTP ${tokenRes.status}).`);
    }
    const envPath = new URL('../.env.local', import.meta.url);
    const env = await readFile(envPath, 'utf8').catch((error) => {
      if (error.code === 'ENOENT') return '';
      throw error;
    });
    const line = `SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`;
    const updated = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(env)
      ? env.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/m, () => line)
      : `${env.trimEnd()}\n${line}\n`;
    await writeFile(envPath, updated, { mode: 0o600 });
    await chmod(envPath, 0o600);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('Spotify reconnected. You can close this tab.');
    console.log('Spotify reconnected. Refresh token saved to .env.local (not displayed).');
    console.log('Update SPOTIFY_REFRESH_TOKEN in the hosting environment and redeploy to reconnect the live site.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Spotify reconnection failed.');
    res.writeHead(500).end('Reconnection failed. Check the terminal and run the script again.');
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    server.close();
  }
});
const timeout = setTimeout(() => {
  console.error('Spotify reconnection timed out. Run the script again.');
  server.close();
  process.exitCode = 1;
}, 5 * 60_000);
server.on('error', (error) => {
  clearTimeout(timeout);
  console.error(error.code === 'EADDRINUSE'
    ? 'Port 3000 is in use. Stop the local dev server before reconnecting Spotify.'
    : 'Could not start the Spotify callback server.');
  process.exitCode = 1;
});
server.listen(3000, '127.0.0.1', () => {
  const authUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID, scope: SCOPES,
    redirect_uri: REDIRECT_URI, state,
  });
  console.log(`Open this link to reconnect Spotify:\n${authUrl}`);
});
