import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decode_track, progress } from '../build/dev/javascript/portfolio/lib/player.mjs';
import { Finished, Unavailable } from '../build/dev/javascript/portfolio/lib/playback_progress.mjs';

test('browser track decoding keeps unavailable, paused, and playing states distinct', () => {
  assert.equal(decode_track('{"title":null,"isPlaying":false}').isOk(), true);
  const wire = { title: 'song', artist: 'artist', url: 'https://open.spotify.com/track/1', albumArt: null, isPlaying: true, progressMs: 90, durationMs: 100 };
  const result = decode_track(JSON.stringify(wire));
  assert.equal(result.isOk(), true);
  const track = result[0][0];
  assert.ok(progress(track, 1000, 1020) instanceof Finished);
  const paused = decode_track(JSON.stringify({ ...wire, isPlaying: false }))[0][0];
  assert.ok(progress(paused, 1000, 1020) instanceof Unavailable);
  assert.equal(decode_track(JSON.stringify({ ...wire, durationMs: 'bad' })).isOk(), false);
  assert.equal(decode_track('not json').isOk(), false);
});
