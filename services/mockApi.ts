
import { Team, User, Submission, RedirectLink, MockApiResponse } from '../types';

const STORAGE_KEYS = {
  TEAMS: 'tp_teams',
  USERS: 'tp_users',
  SUBMISSIONS: 'tp_submissions',
  REDIRECTS: 'tp_redirects',
  CURRENT_USER: 'tp_current_user'
};

const getStorage = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setStorage = <T,>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockApi = {
  // Auth simulation
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  login: (email: string): MockApiResponse<User> => {
    const users = getStorage<User>(STORAGE_KEYS.USERS);
    let user = users.find(u => u.email === email);
    if (!user) {
      user = { id: crypto.randomUUID(), email, fullName: email.split('@')[0] };
      users.push(user);
      setStorage(STORAGE_KEYS.USERS, users);
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, data: user };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Team Operations
  createTeam: (name: string, owner: User): MockApiResponse<Team> => {
    const teams = getStorage<Team>(STORAGE_KEYS.TEAMS);
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name,
      ownerId: owner.id,
      members: [{ id: owner.id, name: owner.fullName, email: owner.email, role: 'Leader' }],
      createdAt: new Date().toISOString()
    };
    teams.push(newTeam);
    setStorage(STORAGE_KEYS.TEAMS, teams);
    
    // Update user
    const users = getStorage<User>(STORAGE_KEYS.USERS);
    const updatedUsers = users.map(u => u.id === owner.id ? { ...u, teamId: newTeam.id } : u);
    setStorage(STORAGE_KEYS.USERS, updatedUsers);
    
    // Update session
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ ...owner, teamId: newTeam.id }));
    
    return { success: true, data: newTeam };
  },

  getTeam: (teamId: string): Team | null => {
    return getStorage<Team>(STORAGE_KEYS.TEAMS).find(t => t.id === teamId) || null;
  },

  addTeamMember: (teamId: string, email: string, name: string): MockApiResponse<Team> => {
    const teams = getStorage<Team>(STORAGE_KEYS.TEAMS);
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return { success: false, error: 'Team not found' };

    const newMember = { id: crypto.randomUUID(), name, email, role: 'Member' as const };
    teams[teamIndex].members.push(newMember);
    setStorage(STORAGE_KEYS.TEAMS, teams);
    
    // Note: In a real app, we'd also link the User record to this teamId when they next log in.
    return { success: true, data: teams[teamIndex] };
  },

  // Form/Submission Operations
  submitForm: (data: Partial<Submission>): MockApiResponse<Submission> => {
    const submissions = getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS);
    const newSubmission: Submission = {
      id: crypto.randomUUID(),
      teamId: data.teamId!,
      title: data.title || 'Untitled',
      description: data.description || '',
      externalUrl: data.externalUrl || '',
      pdfUrl: data.pdfUrl,
      imageUrl: data.imageUrl,
      timestamp: new Date().toISOString()
    };
    submissions.push(newSubmission);
    setStorage(STORAGE_KEYS.SUBMISSIONS, submissions);
    return { success: true, data: newSubmission };
  },

  getSubmissions: (teamId: string): Submission[] => {
    return getStorage<Submission>(STORAGE_KEYS.SUBMISSIONS).filter(s => s.teamId === teamId);
  },

  // Redirect Operations
  getRedirects: (teamId: string): RedirectLink[] => {
    return getStorage<RedirectLink>(STORAGE_KEYS.REDIRECTS).filter(r => r.teamId === teamId);
  },

  addRedirect: (teamId: string, keyword: string, url: string): MockApiResponse<RedirectLink> => {
    const redirects = getStorage<RedirectLink>(STORAGE_KEYS.REDIRECTS);
    const teamRedirects = redirects.filter(r => r.teamId === teamId);
    
    if (teamRedirects.length >= 10) {
      return { success: false, error: 'Maximum 10 redirects allowed per team' };
    }
    
    if (redirects.some(r => r.keyword.toLowerCase() === keyword.toLowerCase())) {
      return { success: false, error: 'Keyword already exists globally' };
    }

    const newRedirect: RedirectLink = {
      id: crypto.randomUUID(),
      teamId,
      keyword: keyword.toLowerCase(),
      url,
      clicks: 0
    };
    redirects.push(newRedirect);
    setStorage(STORAGE_KEYS.REDIRECTS, redirects);
    return { success: true, data: newRedirect };
  },

  deleteRedirect: (id: string): MockApiResponse<boolean> => {
    const redirects = getStorage<RedirectLink>(STORAGE_KEYS.REDIRECTS);
    setStorage(STORAGE_KEYS.REDIRECTS, redirects.filter(r => r.id !== id));
    return { success: true, data: true };
  },

  resolveKeyword: (keyword: string): string | null => {
    const redirects = getStorage<RedirectLink>(STORAGE_KEYS.REDIRECTS);
    const found = redirects.find(r => r.keyword === keyword.toLowerCase());
    if (found) {
      // Increment clicks
      found.clicks++;
      setStorage(STORAGE_KEYS.REDIRECTS, redirects);
      return found.url;
    }
    return null;
  }
};
