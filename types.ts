
export interface User {
  id: string;
  email: string;
  fullName: string;
  teamId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Leader' | 'Member';
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
}

export interface Submission {
  id: string;
  teamId: string;
  title: string;
  description: string;
  externalUrl: string;
  pdfUrl?: string;
  imageUrl?: string;
  timestamp: string;
}

export interface RedirectLink {
  id: string;
  teamId: string;
  keyword: string;
  url: string;
  clicks: number;
}

export interface MockApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}
