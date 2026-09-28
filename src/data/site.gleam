import gleam/json

pub type Icon {
  Icon(src: String, sizes: String, media_type: String)
}

pub type Site {
  Site(
    name: String,
    title: String,
    description: String,
    start_url: String,
    display: String,
    background_color: String,
    theme_color: String,
    favicons: List(Icon),
    apple_icon: String,
    app_icons: List(Icon),
  )
}

pub fn site() -> Site {
  Site(
    name: "Zidan Kazi",
    title: "zidan kazi",
    description: "builder portfolio of zidan kazi",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    favicons: [
      Icon("/favicon-16x16.png", "16x16", "image/png"),
      Icon("/favicon-32x32.png", "32x32", "image/png"),
    ],
    apple_icon: "/apple-touch-icon.png",
    app_icons: [
      Icon("/android-chrome-192x192.png", "192x192", "image/png"),
      Icon("/android-chrome-512x512.png", "512x512", "image/png"),
    ],
  )
}

pub fn metadata_json() -> String {
  let data = site()
  json.object([
    #("title", json.string(data.title)),
    #("description", json.string(data.description)),
    #(
      "icons",
      json.object([
        #(
          "icon",
          json.array(data.favicons, fn(icon) {
            json.object([
              #("url", json.string(icon.src)),
              #("sizes", json.string(icon.sizes)),
              #("type", json.string(icon.media_type)),
            ])
          }),
        ),
        #("apple", json.string(data.apple_icon)),
      ]),
    ),
  ])
  |> json.to_string
}

pub fn manifest_json() -> String {
  let data = site()
  json.object([
    #("name", json.string(data.name)),
    #("short_name", json.string(data.name)),
    #("description", json.string(data.description)),
    #("start_url", json.string(data.start_url)),
    #("display", json.string(data.display)),
    #("background_color", json.string(data.background_color)),
    #("theme_color", json.string(data.theme_color)),
    #(
      "icons",
      json.array(data.app_icons, fn(icon) {
        json.object([
          #("src", json.string(icon.src)),
          #("sizes", json.string(icon.sizes)),
          #("type", json.string(icon.media_type)),
          #("purpose", json.string("any")),
        ])
      }),
    ),
  ])
  |> json.to_string
}
