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
