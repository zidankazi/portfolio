import gleam/float
import gleam/int
import gleam/option.{type Option, Some}

pub type Progress {
  Unavailable
  Active(elapsed_ms: Int, percent: Float)
  Finished(elapsed_ms: Int, percent: Float)
}

pub fn calculate(
  is_playing: Bool,
  progress_ms: Option(Int),
  duration_ms: Option(Int),
  synced_at: Int,
  now: Int,
) -> Progress {
  case is_playing, progress_ms, duration_ms {
    True, Some(progress), Some(duration) -> {
      let elapsed = int.min(progress + int.max(0, now - synced_at), duration)
      let percent = case duration {
        0 -> 0.0
        _ ->
          int.to_float(float.round(
            int.to_float(elapsed) /. int.to_float(duration) *. 10_000.0,
          ))
          /. 100.0
      }
      case elapsed >= duration {
        True -> Finished(elapsed_ms: elapsed, percent: percent)
        False -> Active(elapsed_ms: elapsed, percent: percent)
      }
    }
    _, _, _ -> Unavailable
  }
}
