import gleam/float
import gleam/result

pub type State {
  State(drift: Float, elapsed: Float, scroll: Float, momentum: Float)
}

pub type Layer {
  Layer(x: Float, y: Float, opacity: Float)
}

pub type Frame {
  Frame(
    state: State,
    shift: Float,
    sway: Float,
    rotate_y: Float,
    rotate_z: Float,
    scale_x: Float,
    layers: List(Layer),
  )
}

pub fn init(scroll: Float) -> State {
  State(0.0, 0.0, scroll, 0.0)
}

pub fn smooth(progress: Float) -> Float {
  let p = float.clamp(progress, 0.0, 1.0)
  p *. p *. { 3.0 -. 2.0 *. p }
}

pub fn frame(
  state: State,
  left: Bool,
  dt: Float,
  scroll_y: Float,
  height: Float,
) -> Frame {
  let dt = float.clamp(dt, 0.0, 0.05)
  let elapsed = state.elapsed +. dt
  let entrance = smooth(elapsed /. 1.1)
  let scroll =
    state.scroll
    +. { scroll_y -. state.scroll }
    *. { 1.0 -. float.exponential(0.0 -. dt /. 0.14) }
  let velocity =
    float.clamp({ scroll -. state.scroll } /. dt /. 1000.0, -1.0, 1.0)
  let momentum =
    state.momentum
    +. { velocity -. state.momentum }
    *. { 1.0 -. float.exponential(0.0 -. dt /. 0.18) }
  let phase =
    elapsed
    +. case left {
      True -> 0.0
      False -> 4.7
    }
  let direction = case left {
    True -> -1.0
    False -> 1.0
  }
  let wave = { sine(phase *. 0.62) +. 1.0 } /. 2.0
  let idle = sine(phase *. 0.37) *. 0.72 +. sine(phase *. 0.81) *. 0.28
  let turn = float.clamp(idle +. momentum *. 0.55, -1.0, 1.0)
  let energy =
    float.min(
      1.0,
      { sine(phase *. 0.93 -. 0.8) +. 1.0 }
        /. 2.0
        +. float.absolute_value(momentum)
        *. 0.25,
    )
  let drift =
    state.drift
    +. dt
    *. 12.0
    *. { 0.6 +. wave *. 1.65 }
    *. direction
    *. entrance
  let raw = drift +. scroll *. 0.42 *. direction
  let remainder = result.unwrap(float.modulo(raw, height), 0.0)
  let shift = case remainder == 0.0 {
    True -> 0.0
    False -> remainder -. height
  }

  Frame(
    State(drift, elapsed, scroll, momentum),
    shift,
    sine(phase *. 0.42) *. 4.0 *. entrance,
    turn *. direction *. 15.0 *. entrance,
    0.0 -. turn *. direction *. 1.4 *. entrance,
    1.0 +. wave *. 0.045 *. entrance,
    [
      Layer(
        turn *. -0.7 *. direction *. 3.0 *. entrance,
        turn *. -0.7 *. 7.0 *. entrance,
        0.85 +. { 1.0 -. energy } *. 0.15,
      ),
      Layer(0.0, 0.0, 1.0),
      Layer(
        turn *. 0.45 *. direction *. 3.0 *. entrance,
        turn *. 0.45 *. 7.0 *. entrance,
        0.65 +. energy *. 0.35,
      ),
    ],
  )
}

@external(javascript, "./math_ffi.mjs", "sine")
fn sine(value: Float) -> Float
