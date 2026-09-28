export type ProjectLink = {
  label: string;
  href: string;
};

export type Project = {
  title: string;
  description: string;
  descriptionLink?: { text: string; href: string };
  links: ProjectLink[];
  preview?: string;
  previewMotion?: { src: string; type: 'gif' | 'video' };
  previewSize?: { width: number; height: number };
};
