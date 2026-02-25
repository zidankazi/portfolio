#!/usr/bin/env node
/**
 * One-time script to get a Spotify refresh token.
 * Uses https://localhost:3000 as the redirect URI (already in your Spotify dashboard).
 *
 * Usage:
 *   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/get-spotify-token.mjs
 */

import * as readline from 'readline';
import { exec } from 'child_process';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'https://localhost:3000';
const SCOPES = 'user-read-currently-playing user-read-recently-played';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set.');
  process.exit(1);
}

const authUrl =
  'https://accounts.spotify.com/authorize?' +
  new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
  });

console.log('\nOpening Spotify in your browser...\n');
exec(`open "${authUrl}"`);

console.log('1. Click "Allow" in the browser.');
console.log('2. The page will fail to load — that is expected.');
console.log('3. Copy the full URL from your browser address bar.');
console.log('   It will look like: https://localhost:3000?code=AQCx...\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the URL here and press Enter: ', async (input) => {
  rl.close();

  let code;
  try {
    code = new URL(input.trim()).searchParams.get('code');
  } catch {
    console.error('\nCould not parse that URL.');
    process.exit(1);
  }

  if (!code) {
    console.error('\nNo "code" found in the URL. Copy the full address bar URL after clicking Allow.');
    process.exit(1);
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokens = await tokenRes.json();

  if (tokens.error) {
    console.error('\nFailed:', tokens.error, '-', tokens.error_description);
    process.exit(1);
  }

  console.log('\n✅ Add these to .env.local and Vercel:\n');
  console.log(`SPOTIFY_CLIENT_ID=${CLIENT_ID}`);
  console.log(`SPOTIFY_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('');
});
