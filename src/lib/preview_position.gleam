import gleam/float

pub type Point {
  Point(x: Float, y: Float)
}

pub type Bounds {
  Bounds(left: Float, right: Float)
}

pub type Size {
  Size(width: Float, height: Float)
}

pub type Placement {
  Placement(left: Float, top: Float, width: Float, height: Float)
}

pub const default_size = Size(width: 280.0, height: 210.0)

const gap = 20.0

const inset = 16.0

pub fn place(
  cursor: Point,
  row: Bounds,
  viewport: Size,
  preferred: Size,
) -> Placement {
  let width = float.min(preferred.width, viewport.width -. 2.0 *. inset)
  let height = float.min(preferred.height, viewport.height -. 2.0 *. inset)
  let left = case Nil {
    _ if row.right +. gap +. width <=. viewport.width -. inset ->
      row.right +. gap +. { cursor.x -. row.left } *. 0.025
    _ if row.left -. gap -. width >=. inset -> row.left -. gap -. width
    _ if cursor.x +. gap +. width >. viewport.width -. inset ->
      cursor.x -. width -. gap
    _ -> cursor.x +. gap
  }
  Placement(
    left: float.max(inset, float.min(left, viewport.width -. width -. inset)),
    top: float.max(
      inset,
      float.min(cursor.y -. height /. 2.0, viewport.height -. height -. inset),
    ),
    width: width,
    height: height,
  )
}
