import 'server-only';
import { get_projects_json } from '../../build/dev/javascript/portfolio/data/projects.mjs';
import type { Project } from '@/types/project';

export const projects: Project[] = JSON.parse(get_projects_json());
