import gleam/dynamic/decode
import gleam/int
import gleam/json
import gleam/list
import gleam/result
import gleam/string

pub type Day {
  Day(date: String, count: Int, level: Int)
}

pub fn parse(body: String) -> Result(List(Day), Nil) {
  let day = {
    use date <- decode.field("date", decode.string)
    use count <- decode.field("count", decode.int)
    use level <- decode.field("level", decode.int)
    decode.success(Day(date, count, level))
  }
  let decoder = decode.field("contributions", decode.list(day), decode.success)
  case json.parse(body, decoder) {
    Ok(days) ->
      case
        !list.is_empty(days)
        && list.all(days, fn(day) {
          valid_date(day.date)
          && day.count >= 0
          && day.level >= 0
          && day.level <= 4
        })
      {
        True -> Ok(days)
        False -> Error(Nil)
      }
    Error(_) -> Error(Nil)
  }
}

fn parts(date: String) -> #(Int, Int, Int) {
  case string.split(date, "-") {
    [y, m, d] -> #(
      result.unwrap(int.parse(y), 0),
      result.unwrap(int.parse(m), 0),
      result.unwrap(int.parse(d), 0),
    )
    _ -> #(0, 0, 0)
  }
}

pub fn valid_date(date: String) -> Bool {
  let #(year, month, day) = parts(date)
  let leap = year % 4 == 0 && { year % 100 != 0 || year % 400 == 0 }
  let length = case month {
    2 if leap -> 29
    2 -> 28
    4 | 6 | 9 | 11 -> 30
    _ -> 31
  }
  string.length(date) == 10
  && year >= 1
  && month >= 1
  && month <= 12
  && day >= 1
  && day <= length
}

pub fn weekday(date: String) -> Int {
  let #(year, month, day) = parts(date)
  let year = case month < 3 {
    True -> year - 1
    False -> year
  }
  let offset =
    result.unwrap(at([0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4], month - 1), 0)
  { year + year / 4 - year / 100 + year / 400 + offset + day } % 7
}

pub fn weeks(days: List(Day)) -> List(List(Day)) {
  let reversed =
    list.fold(days, [], fn(weeks, day) {
      case weeks {
        [] -> [[day]]
        [week, ..rest] ->
          case weekday(day.date) {
            0 -> [[day], week, ..rest]
            _ -> [[day, ..week], ..rest]
          }
      }
    })
  reversed |> list.reverse |> list.map(list.reverse)
}

pub fn fit(days: List(Day), width: Int) -> List(List(Day)) {
  let weeks = weeks(days)
  let count = int.min(53, int.max(1, { width + 3 } / 14))
  list.drop(weeks, int.max(0, list.length(weeks) - count))
}

pub fn month(date: String) -> String {
  let #(_, month, _) = parts(date)
  result.unwrap(
    at(
      [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      month - 1,
    ),
    "",
  )
}

pub fn labels(weeks: List(List(Day))) -> List(String) {
  list.index_map(weeks, fn(week, index) {
    let name = month(result.unwrap(list.first(week), Day("", 0, 0)).date)
    let previous = case at(weeks, index - 1) {
      Ok([day, ..]) -> month(day.date)
      _ -> ""
    }
    let run =
      list.drop(weeks, index)
      |> list.take_while(fn(week) {
        month(result.unwrap(list.first(week), Day("", 0, 0)).date) == name
      })
      |> list.length
    case name != previous && run >= 3 {
      True -> name
      False -> ""
    }
  })
}

pub fn describe(day: Day) -> String {
  let #(year, _, date) = parts(day.date)
  int.to_string(day.count)
  <> case day.count {
    1 -> " contribution on "
    _ -> " contributions on "
  }
  <> month(day.date)
  <> " "
  <> int.to_string(date)
  <> ", "
  <> int.to_string(year)
}

pub fn total(days: List(Day)) -> Int {
  list.fold(days, 0, fn(total, day) { total + day.count })
}

pub fn next_index(key: String, index: Int, count: Int) -> Int {
  let next = case key {
    "ArrowLeft" -> index - 7
    "ArrowRight" -> index + 7
    "ArrowUp" -> index - 1
    "ArrowDown" -> index + 1
    "Home" -> 0
    "End" -> count - 1
    _ -> index
  }
  int.clamp(next, 0, int.max(0, count - 1))
}

fn at(items: List(a), index: Int) -> Result(a, Nil) {
  case index < 0 {
    True -> Error(Nil)
    False -> items |> list.drop(index) |> list.first
  }
}
