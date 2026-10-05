import gleam/float
import gleam/int
import gleam/list
import gleam/result
import lib/rail_motion

pub type Phrase {
  Phrase(delay: Float, duration: Float, beats: List(Float))
}

pub type Progress {
  Progress(winding: Float, progress: Float, complete: Bool)
}

pub fn phrase(
  slot: Int,
  samples: List(Float),
  delay_sample: Float,
  duration_sample: Float,
) -> Phrase {
  let entry =
    result.unwrap(
      list.first(list.drop(
        [0.0, 225.0, 385.0, 725.0, 65.0, 175.0, 465.0, 640.0],
        slot,
      )),
      0.0,
    )
  let duration =
    result.unwrap(
      list.first(list.drop(
        [940.0, 1070.0, 1150.0, 1240.0, 975.0, 1030.0, 1190.0, 1210.0],
        slot,
      )),
      940.0,
    )
  let #(total, reversed) =
    list.fold(samples, #(0.0, []), fn(acc, sample) {
      let beat = acc.0 +. 0.78 +. float.clamp(sample, 0.0, 1.0) *. 0.44
      #(beat, [beat, ..acc.1])
    })
  Phrase(
    float.max(0.0, entry +. { delay_sample -. 0.5 } *. 28.0),
    duration *. { 0.96 +. duration_sample *. 0.08 },
    reversed |> list.reverse |> list.map(fn(beat) { beat /. total }),
  )
}

pub fn progress(elapsed: Float, duration: Float, reduced: Bool) -> Progress {
  let winding = case reduced {
    True -> 1.0
    False -> float.clamp(elapsed /. 360.0, 0.0, 1.0)
  }
  let t = case reduced {
    True -> 1.0
    False -> float.clamp({ elapsed -. 360.0 } /. duration, 0.0, 1.0)
  }
  Progress(winding, rail_motion.smooth(t), t == 1.0)
}

pub fn visible_count(
  beats: List(Float),
  progress: Float,
  previous: Int,
) -> Int {
  int.max(
    previous,
    beats |> list.take_while(fn(beat) { beat <=. progress }) |> list.length,
  )
}
