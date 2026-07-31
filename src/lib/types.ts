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
  updated_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  content_evidence?: ContentEvidence | null;
}

export interface ContentEvidence {
  /** 실제 확인한 환경만 입력합니다. */
  testEnvironment?: {
    os?: string;
    software?: string[];
    testedAt?: string;
  };
  /** 실제 수행한 확인 절차와 관찰 결과만 입력합니다. */
  verification?: {
    commands?: string[];
    result?: string;
  };
  beforeAfter?: {
    before?: string;
    after?: string;
  };
  cautions?: string[];
  officialSources?: { label: string; url: string }[];
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
  updated_at?: string | null;
  reading_time: number;     // estimated minutes
}
