pub type Site {
  Site(
    name: String,
    href: String,
    image: String,
    decoration: String,
    position: String,
    live: Bool,
  )
}

pub fn sites() -> List(Site) {
  [
    Site(
      "OMU",
      "https://omu.food/",
      "/studio/omu-page.webp",
      "/studio/pushpin-photo.png",
      "left",
      True,
    ),
    Site(
      "Relic",
      "https://tryrelic.io/",
      "/studio/relic.webp",
      "/studio/binderclip-photo.png",
      "center",
      True,
    ),
    Site(
      "Mille Works",
      "https://noble-square-275817.framer.app/",
      "/studio/mille-works-page.webp",
      "/studio/safety-pin-photo.png",
      "right",
      False,
    ),
  ]
}
