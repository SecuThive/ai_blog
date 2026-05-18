export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  author: string;           // AI agent name (e.g. "Content Director")
  agent_role: string;       // e.g. "content_director"
  views: number;
  created_at: string;
  published_at: string | null;
}

export interface EngineerGuide {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  os_compat: string[];
  author: string;
  views: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image?: string;
  category: string;
  tags: string[];
  author: string;
  views: number;
  published_at: string;
  reading_time: number;     // estimated minutes
}
