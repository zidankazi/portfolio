import gleam/float
import gleam/int
import gleam/list
import gleam/string

pub type Joint {
  Joint(x: Float, y: Float)
}

pub type Pose {
  Pose(angle: Float, stretch: Float)
}

pub type Row {
  Row(y: Float, columns: List(Float), glyphs: String)
}

pub type Wrist {
  Wrist(x: Float, y: Float, angle: Float)
}

pub fn wrist(right: Bool, elapsed: Float) -> Wrist {
  let phase =
    elapsed
    *. 0.001
    +. case right {
      True -> 2.1
      False -> 0.0
    }
  let direction = case right {
    True -> -1.0
    False -> 1.0
  }
  Wrist(
    sine(phase *. 0.68) *. 2.5,
    sine(phase *. 0.91) *. 3.0,
    sine(phase *. 0.57) *. 1.35 *. direction,
  )
}

// Gather a strand, release it, then give it a final pluck.
pub fn pull(elapsed: Float) -> Float {
  case elapsed <. 0.0 {
    True -> 0.0
    False -> {
      let first = { elapsed *. 0.001 -. 0.27 } /. 0.2
      let second = { elapsed *. 0.001 -. 1.05 } /. 0.18
      float.exponential(0.0 -. first *. first)
      *. 0.85
      +. float.exponential(0.0 -. second *. second)
      *. 0.5
    }
  }
}

pub fn joint(part: Int, right: Bool) -> Joint {
  let joint = case part {
    1 -> Joint(43.0, 112.0)
    2 -> Joint(79.0, 116.0)
    3 -> Joint(116.0, 112.0)
    4 -> Joint(155.0, 108.0)
    5 -> Joint(180.0, 101.0)
    _ -> Joint(120.0, 0.0)
  }
  case right {
    True -> Joint(240.0 -. joint.x, joint.y)
    False -> joint
  }
}

// Assign whole ASCII cells to joints so all three tone layers stay registered.
// The diagonal cuts follow the knuckles; the palm remains a continuous piece.
pub fn rows(source: String, part: Int, right: Bool) -> List(Row) {
  source
  |> string.split("\n")
  |> list.index_map(fn(line, row) {
    let y = { int.to_float(row) +. 0.8 } *. 4.0
    let cells =
      line
      |> string.to_graphemes
      |> list.index_map(fn(glyph, column) {
        let x = int.to_float(column) *. 2.4 +. 1.2
        let local_x = case right {
          True -> 240.0 -. x
          False -> x
        }
        #(glyph, x, region(local_x, y) == part && glyph != " ")
      })
      |> list.filter(fn(cell) { cell.2 })
    Row(
      y,
      list.map(cells, fn(cell) { cell.1 }),
      cells |> list.map(fn(cell) { cell.0 }) |> string.concat,
    )
  })
  |> list.filter(fn(row) { row.glyphs != "" })
}

fn region(x: Float, y: Float) -> Int {
  case Nil {
    _ if y >=. 96.0 && x >. 176.0 +. { y -. 96.0 } *. 0.55 -> 5
    _ if y <. 112.0 -> 0
    _ if x <. 61.0 -. { y -. 112.0 } *. 0.12 -> 1
    _ if x <. 99.0 -> 2
    _ if x <. 143.0 -> 3
    _ -> 4
  }
}

pub fn pose(part: Int, right: Bool, elapsed: Float, pull: Float) -> Pose {
  let phase = elapsed *. 0.001 +. int.to_float(part) *. 0.73
  let phase =
    phase
    +. case right {
      True -> 2.1
      False -> 0.0
    }
  let direction = case right {
    True -> -1.0
    False -> 1.0
  }
  let spread = { int.to_float(part) -. 2.5 } *. 1.6
  let idle = sine(phase *. 1.15) *. 0.7 +. sine(phase *. 0.57) *. 0.3
  Pose(
    { idle *. 1.25 +. spread *. pull } *. direction,
    1.0 -. float.clamp(pull, 0.0, 1.0) *. 0.075 -. { idle +. 1.0 } *. 0.007,
  )
}

@external(javascript, "./math_ffi.mjs", "sine")
fn sine(value: Float) -> Float
