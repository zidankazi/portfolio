import gleam/float
import gleam/int

pub type Rgb =
  #(Int, Int, Int)

pub fn saturation_of(color: Rgb) -> Float {
  let #(red, green, blue) = color
  let maximum = int.max(int.max(red, green), blue)
  let minimum = int.min(int.min(red, green), blue)
  case maximum {
    0 -> 0.0
    _ -> int.to_float(maximum - minimum) /. int.to_float(maximum)
  }
}

pub fn tame(color: Rgb) -> Rgb {
  let #(red, green, blue) = color
  let red = int.to_float(red)
  let green = int.to_float(green)
  let blue = int.to_float(blue)
  let luma = 0.299 *. red +. 0.587 *. green +. 0.114 *. blue
  let red = red +. { luma -. red } *. 0.3
  let green = green +. { luma -. green } *. 0.3
  let blue = blue +. { luma -. blue } *. 0.3
  let maximum = float.max(float.max(red, green), float.max(blue, 1.0))
  let scale = float.clamp(155.0 /. maximum, min: 0.6, max: 3.2)
  #(
    float.round(float.min(255.0, red *. scale)),
    float.round(float.min(255.0, green *. scale)),
    float.round(float.min(255.0, blue *. scale)),
  )
}

pub fn brighten(color: Rgb, target: Float) -> Rgb {
  let #(red, green, blue) = color
  let maximum = int.max(int.max(red, green), int.max(blue, 1))
  let scale = float.max(target /. int.to_float(maximum), 1.0)
  #(
    int.min(255, float.round(int.to_float(red) *. scale)),
    int.min(255, float.round(int.to_float(green) *. scale)),
    int.min(255, float.round(int.to_float(blue) *. scale)),
  )
}
