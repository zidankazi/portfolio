import data/art
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string

pub type Rect {
  Rect(
    left: Float,
    top: Float,
    right: Float,
    bottom: Float,
    width: Float,
    height: Float,
  )
}

pub type Point {
  Point(x: Float, y: Float)
}

pub type Curve {
  Curve(first: Point, second: Point, end: Point)
}

pub type Chain {
  Chain(path: String, count: Int, end: Point, clip: Rect)
}

pub fn chain(
  side: Int,
  index: Int,
  root: Rect,
  hand: Rect,
  content: Rect,
  box: Rect,
  crossed: Option(Rect),
  mobile: Bool,
) -> Chain {
  let tip =
    result.unwrap(
      list.first(list.drop(art.wraps(), 3 - index)),
      art.Wrap(0.0, 0.0, 0.0, 0.0, 0.0),
    )
  let scale = hand.width /. 240.0
  let sx =
    hand.left
    -. root.left
    +. case side {
      0 -> tip.x
      _ -> 240.0 -. tip.x
    }
    *. scale
  let sy = hand.top -. root.top +. tip.tip_y *. scale
  let end_side = case crossed {
    Some(_) -> 1 - side
    None -> side
  }
  let ex =
    case end_side {
      0 -> box.left +. 3.0
      _ -> box.right -. 3.0
    }
    -. root.left
  let ey = box.top -. root.top +. 14.0
  let inset = case mobile {
    True -> 4.0 +. int.to_float(index) *. 2.5
    False -> 30.0 +. int.to_float(index) *. 9.0
  }
  let gutter =
    case side {
      0 -> content.left -. inset
      _ -> content.right +. inset
    }
    -. root.left
  let span = float.max(0.0, ey -. sy)
  let #(curves, clip) = case crossed {
    None -> #(
      [
        Curve(
          Point(sx +. { gutter -. sx } *. 0.33, sy +. span *. 0.33),
          Point(gutter, ey -. 24.0),
          Point(ex, ey),
        ),
      ],
      Rect(0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
    )
    Some(crossed) -> {
      let left = crossed.left -. root.left
      let right = crossed.right -. root.left
      let bottom = crossed.bottom -. root.top
      let top = crossed.top -. root.top
      let entry = case side {
        0 -> left -. 7.0
        _ -> right +. 7.0
      }
      let exit = case side {
        0 -> right +. 7.0
        _ -> left -. 7.0
      }
      let curves = case side * 4 + index {
        1 -> [
          Curve(
            Point(
              sx +. { entry -. sx } *. 0.33,
              sy +. { bottom -. 15.0 -. sy } *. 0.33,
            ),
            Point(entry -. 3.0, bottom -. 40.0),
            Point(entry, bottom -. 12.0),
          ),
          Curve(
            Point(left +. crossed.width *. 0.3, bottom -. 10.0),
            Point(right -. crossed.width *. 0.3, bottom -. 7.0),
            Point(exit, bottom -. 5.0),
          ),
          Curve(
            Point(exit +. 3.0, bottom +. 1.0),
            Point(ex +. 4.0, ey -. 9.0),
            Point(ex, ey),
          ),
        ]
        _ -> [
          Curve(
            Point(sx +. { entry -. sx } *. 0.33, sy +. { top -. sy } *. 0.33),
            Point(entry +. 3.0, top +. 12.0),
            Point(entry, top +. crossed.height *. 0.65),
          ),
          Curve(
            Point(right -. crossed.width *. 0.1, top +. crossed.height *. 0.44),
            Point(right -. crossed.width *. 0.23, top +. crossed.height *. 0.19),
            Point(right -. crossed.width *. 0.34, top -. 3.0),
          ),
          Curve(
            Point(right -. crossed.width *. 0.45, top +. 1.0),
            Point(left +. crossed.width *. 0.22, bottom -. 28.0),
            Point(exit, bottom -. 11.0),
          ),
          Curve(
            Point(exit -. 3.0, bottom +. 1.0),
            Point(ex -. 4.0, ey -. 9.0),
            Point(ex, ey),
          ),
        ]
      }
      let x = case side * 4 + index {
        1 -> left
        _ -> right -. crossed.width *. 0.4
      }
      let width =
        crossed.width
        *. case side * 4 + index {
          1 -> 1.0
          _ -> 0.4
        }
      #(curves, Rect(x, top, x +. width, bottom, width, crossed.height))
    }
  }
  let points =
    list.flat_map(curves, fn(curve) { [curve.first, curve.second, curve.end] })
  let #(length, _) =
    list.fold(points, #(0.0, Point(sx, sy)), fn(acc, point) {
      let dx = point.x -. acc.1.x
      let dy = point.y -. acc.1.y
      #(
        acc.0 +. result.unwrap(float.square_root(dx *. dx +. dy *. dy), 0.0),
        point,
      )
    })
  let path =
    "M"
    <> n(sx)
    <> ","
    <> n(sy)
    <> string.concat(
      list.map(curves, fn(curve) {
        " C"
        <> string.join(
          list.flat_map([curve.first, curve.second, curve.end], fn(point) {
            [n(point.x), n(point.y)]
          }),
          " ",
        )
      }),
    )
  Chain(
    path,
    float.ceiling(length /. 115.2) |> float.truncate |> fn(count) { count * 16 },
    Point(ex, ey),
    clip,
  )
}

fn n(value: Float) -> String {
  float.to_string(float.to_precision(value, 1))
}
