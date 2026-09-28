import gleam/option.{type Option, None, Some}

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

pub fn projects() -> List(Project) {
  [
    Project(
      title: "relic",
      description: "the source of truth for ai-native companies. memory that builds itself from your team's stack and answers agent queries over mcp, with a source behind every fact.",
      description_link: None,
      links: [ProjectLink(label: "site", href: "https://tryrelic.io")],
      preview: Some("/projects/relic-loop-poster.webp"),
      preview_motion: Some(Video("/projects/relic-loop.mp4")),
      preview_size: None,
    ),
    Project(
      title: "roster",
      description: "terminal multiplexer for claude code agents. run several in real panes and see which one is blocked, working, or done — plus the exact prompt each one is waiting on.",
      description_link: None,
      links: [
        ProjectLink(
          label: "github",
          href: "https://github.com/zidankazi/roster",
        ),
        ProjectLink(label: "site", href: "https://roster-dev.vercel.app"),
      ],
      preview: Some("/projects/roster-demo-poster.webp"),
      preview_motion: Some(Video("/projects/roster-demo.mp4")),
      preview_size: None,
    ),
    Project(
      title: "multi-agent hide and seek",
      description: "trained with self-play ppo, reproducing the emergent tool use from openai's 2019 paper.",
      description_link: Some(DescriptionLink(
        text: "openai's 2019 paper",
        href: "https://arxiv.org/abs/1909.07528",
      )),
      links: [
        ProjectLink(
          label: "github",
          href: "https://github.com/zidankazi/hide-and-seek",
        ),
      ],
      preview: Some("/projects/hide-and-seek.webp"),
      preview_motion: Some(Gif("/projects/hide-and-seek.gif")),
      preview_size: None,
    ),
    Project(
      title: "sponge",
      description: "gamified ai-assisted coding interview practice. built in 24 hours at quackhacks '26.",
      description_link: None,
      links: [
        ProjectLink(
          label: "github",
          href: "https://github.com/zidankazi/sponge",
        ),
        ProjectLink(label: "site", href: "https://sponge-alpha.vercel.app"),
        ProjectLink(label: "demo", href: "https://youtu.be/vZ8cEIYBHMU"),
      ],
      preview: Some("/projects/sponge.webp"),
      preview_motion: None,
      preview_size: None,
    ),
    Project(
      title: "zilean",
      description: "privacy-first productivity agent that tracks your digital context to measure focus without sending data to the cloud.",
      description_link: None,
      links: [ProjectLink(label: "site", href: "https://zilean.app")],
      preview: Some("/projects/zilean.webp"),
      preview_motion: None,
      preview_size: None,
    ),
    Project(
      title: "sage",
      description: "iMessage supercharged with xAI's Grok, bringing live internet access to your group chats.",
      description_link: None,
      links: [
        ProjectLink(label: "github", href: "https://github.com/zidankazi/sage"),
        ProjectLink(
          label: "demo",
          href: "https://x.com/zidaaaaaaaannnn/status/2012721935369515508",
        ),
      ],
      preview: Some("/projects/sage-thinking-poster.webp"),
      preview_motion: Some(Video("/projects/sage-thinking.mp4")),
      preview_size: Some(PreviewSize(width: 220, height: 360)),
    ),
    Project(
      title: "orbital",
      description: "real-time satellite tracker for the terminal. renders earth as a 3d ascii globe and tracks satellites utilizing live sgp4 mechanics.",
      description_link: None,
      links: [
        ProjectLink(
          label: "github",
          href: "https://github.com/zidankazi/orbital",
        ),
      ],
      preview: Some("/projects/orbital.webp"),
      preview_motion: Some(Gif("/projects/orbital.gif")),
      preview_size: None,
    ),
  ]
}
