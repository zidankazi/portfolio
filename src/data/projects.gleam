import gleam/option.{type Option}

pub type ProjectLink {
  ProjectLink(label: String, href: String)
}

pub type DescriptionLink {
  DescriptionLink(text: String, href: String)
}

pub type PreviewMotion {
  Gif(src: String)
  Video(src: String)
}

pub type PreviewSize {
  PreviewSize(width: Int, height: Int)
}

pub type Project {
  Project(
    title: String,
    description: String,
    description_link: Option(DescriptionLink),
    links: List(ProjectLink),
    preview: Option(String),
    preview_motion: Option(PreviewMotion),
    preview_size: Option(PreviewSize),
  )
}
