import assert from 'node:assert/strict';
import test from 'node:test';
import * as state from '../build/dev/javascript/portfolio/lib/projects_state.mjs';

test('project list preserves hover, focus, pinning, and touch toggle behavior', () => {
  const initial = Object.freeze(state.init());
  assert.equal(state.is_open(initial), false);

  let model = state.update(initial, new state.MouseEntered());
  assert.equal(state.is_open(model), true);
  assert.equal(state.is_open(initial), false);
  model = state.update(model, new state.FocusEntered());
  model = state.update(model, new state.MouseLeft());
  assert.equal(state.is_open(model), true);
  model = state.update(model, new state.FocusLeft());
  assert.equal(state.is_open(model), false);

  model = state.update(model, new state.MouseEntered());
  model = state.update(model, new state.TogglePinned());
  model = state.update(model, new state.MouseLeft());
  assert.equal(state.is_open(model), true);
  model = state.update(model, new state.TogglePinned());
  assert.equal(state.is_open(model), false);

  model = state.update(model, new state.HoverCapabilityChanged(false));
  model = state.update(model, new state.FocusEntered());
  model = state.update(model, new state.MouseEntered());
  assert.equal(state.is_open(model), false);
  model = state.update(model, new state.TogglePinned());
  assert.equal(state.is_open(model), true);
  model = state.update(model, new state.MouseLeft());
  model = state.update(model, new state.TogglePinned());
  assert.equal(state.is_open(model), false);

  model = state.update(model, new state.HoverCapabilityChanged(true));
  assert.equal(state.is_open(model), true);
  model = state.update(model, new state.FocusLeft());
  assert.equal(state.is_open(model), false);
});
