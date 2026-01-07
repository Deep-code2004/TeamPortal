
import React, { useState, useEffect, useCallback } from 'react';
import { User, Team, Submission, RedirectLink } from './types';
import { mockApi } from './services/mockApi';
import { GoogleGenAI, Type } from "@google/genai";

// Components
const Navbar = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => (
  <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-white p-1.5 rounded-lg text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
          </div>
          <span className="font-bold text-xl tracking-tight">TeamPortal</span>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block text-sm font-medium opacity-90">Hello, {user.fullName}</span>
            <button 
              onClick={onLogout}
              className="bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-md text-sm transition-colors font-medium border border-indigo-400"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  </nav>
);

const AuthPage = ({ onLogin }: { onLogin: (email: string) => void }) => {
  const [email, setEmail] = useState('');
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Sign in to Attendee Portal</h2>
          <p className="mt-2 text-sm text-gray-600">Manage your hackathon project and team</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(email); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md active:scale-95">
              Continue with Email
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400 uppercase font-semibold">
            <div className="h-px w-full bg-gray-200"></div>
            <span>secure access</span>
            <div className="h-px w-full bg-gray-200"></div>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateTeam = ({ onCreated }: { onCreated: (team: Team) => void }) => {
  const [name, setName] = useState('');
  const user = mockApi.getCurrentUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = mockApi.createTeam(name, user);
    if (res.success && res.data) onCreated(res.data);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Team</h2>
        <p className="text-gray-600 mb-8">To get started, give your project team a unique name.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Team Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Super Coders, AI Rebels"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-indigo-700 transition-all">
            Create Team
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ team, onTeamUpdate }: { team: Team, onTeamUpdate: (t: Team) => void }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'forms' | 'redirects'>('team');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [redirects, setRedirects] = useState<RedirectLink[]>([]);
  
  // States for forms
  const [formLoading, setFormLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<string | null>(null);

  // States for redirects
  const [keyword, setKeyword] = useState('');
  const [targetUrl, setTargetUrl] = useState('');

  // States for members
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    setSubmissions(mockApi.getSubmissions(team.id));
    setRedirects(mockApi.getRedirects(team.id));
  }, [team.id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'img') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'pdf') setPdfFile(reader.result as string);
        else setImgFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const res = mockApi.submitForm({
        teamId: team.id,
        title,
        description: desc,
        externalUrl: url,
        pdfUrl: pdfFile || undefined,
        imageUrl: imgFile || undefined
      });
      if (res.success) {
        setSubmissions(mockApi.getSubmissions(team.id));
        setTitle(''); setDesc(''); setUrl(''); setPdfFile(null); setImgFile(null);
      }
      setFormLoading(false);
    }, 1000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const res = mockApi.addTeamMember(team.id, newMemberEmail, newMemberName);
    if (res.success && res.data) {
      onTeamUpdate(res.data);
      setNewMemberEmail('');
      setNewMemberName('');
    }
  };

  const handleAddRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    const res = mockApi.addRedirect(team.id, keyword, targetUrl);
    if (res.success) {
      setRedirects(mockApi.getRedirects(team.id));
      setKeyword(''); setTargetUrl('');
    } else {
      alert(res.error);
    }
  };

  const deleteRedirect = (id: string) => {
    mockApi.deleteRedirect(id);
    setRedirects(mockApi.getRedirects(team.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">{team.name}</h1>
        <p className="text-gray-500">Team Dashboard • Manage your submissions and links</p>
      </div>

      <div className="flex border-b border-gray-200 mb-8 space-x-8 overflow-x-auto no-scrollbar">
        {(['team', 'forms', 'redirects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-1 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Team Members</h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {team.members.map((m) => (
                      <tr key={m.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.role === 'Leader' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                            {m.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Add Member</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <input 
                  type="text" placeholder="Full Name" required 
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                />
                <input 
                  type="email" placeholder="Email Address" required 
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)}
                />
                <button className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700">Invite Member</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <h3 className="text-lg font-bold mb-6">New Submission</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Project Title</label>
                <input 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={title} onChange={e => setTitle(e.target.value)} required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea 
                  className="w-full px-4 py-2 border rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={desc} onChange={e => setDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Demo/GitHub URL</label>
                  <input 
                    className="w-full px-4 py-2 border rounded-lg" 
                    value={url} onChange={e => setUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">PDF Pitch Deck</label>
                  <input type="file" accept=".pdf" className="w-full text-sm" onChange={e => handleFileUpload(e, 'pdf')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Project Screenshot</label>
                <input type="file" accept="image/*" className="w-full text-sm" onChange={e => handleFileUpload(e, 'img')} />
                {imgFile && <img src={imgFile} alt="Preview" className="mt-4 h-32 rounded border shadow-sm" />}
              </div>
              <button 
                disabled={formLoading}
                className={`w-full font-bold py-3 rounded-lg text-white transition-all ${formLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md active:scale-[0.98]'}`}
              >
                {formLoading ? 'Submitting...' : 'Submit Project Version'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold">Recent Submissions</h3>
            {submissions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400">No submissions yet.</p>
              </div>
            ) : (
              submissions.map(s => (
                <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900">{s.title}</h4>
                    <span className="text-xs text-gray-400">{new Date(s.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{s.description}</p>
                  <div className="flex space-x-2">
                    {s.pdfUrl && <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100">PDF</span>}
                    {s.imageUrl && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">IMAGE</span>}
                    {s.externalUrl && <a href={s.externalUrl} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-colors">LINK</a>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'redirects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4">Add Redirect Keyword</h3>
              <p className="text-xs text-gray-500 mb-6">Redirect users from <code className="bg-gray-100 px-1 rounded">#/go/keyword</code> to your target URL. Max 10.</p>
              <form onSubmit={handleAddRedirect} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Keyword</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l-lg text-gray-500 text-sm">/go/</span>
                    <input 
                      required className="flex-1 px-4 py-2 border rounded-r-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                      placeholder="e.g. demo" value={keyword} onChange={e => setKeyword(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Target URL</label>
                  <input 
                    required type="url" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="https://your-app.com" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
                  />
                </div>
                <button 
                  disabled={redirects.length >= 10}
                  className="w-full bg-indigo-600 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg shadow hover:bg-indigo-700"
                >
                  {redirects.length >= 10 ? 'Limit Reached' : 'Save Keyword'}
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Keyword</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Clicks</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {redirects.map((r) => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                        {r.keyword}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                        {r.url}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono">
                        {r.clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => deleteRedirect(r.id)} className="text-red-600 hover:text-red-900 font-bold">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {redirects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No keywords configured</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-sm">
              <p><strong>Pro-tip:</strong> These links are active! Try visiting <code>#/go/{'{keyword}'}</code> in a new tab to see them work.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = mockApi.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.teamId) {
          const t = mockApi.getTeam(currentUser.teamId);
          setTeam(t);
        }
      }
      
      // Handle keyword redirection logic
      const hash = window.location.hash;
      if (hash.startsWith('#/go/')) {
        const keyword = hash.split('/go/')[1];
        if (keyword) {
          const url = mockApi.resolveKeyword(keyword);
          if (url) {
            window.location.href = url;
            return;
          } else {
            setRedirectPath('Keyword not found or inactive.');
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
    
    // Listen for hash changes (for redirector simulation)
    const handleHashChange = () => {
      const h = window.location.hash;
      if (h.startsWith('#/go/')) {
        const keyword = h.split('/go/')[1];
        const url = mockApi.resolveKeyword(keyword);
        if (url) window.location.href = url;
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (email: string) => {
    const res = mockApi.login(email);
    if (res.data) {
      setUser(res.data);
      if (res.data.teamId) {
        setTeam(mockApi.getTeam(res.data.teamId));
      }
    }
  };

  const handleLogout = () => {
    mockApi.logout();
    setUser(null);
    setTeam(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (redirectPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center">
          <div className="bg-red-100 text-red-600 p-3 rounded-full w-fit mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Redirect Error</h2>
          <p className="text-gray-600 mb-6">{redirectPath}</p>
          <button 
            onClick={() => { window.location.hash = '#'; setRedirectPath(null); }}
            className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg"
          >
            Go Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-grow">
        {!user ? (
          <AuthPage onLogin={handleLogin} />
        ) : !team ? (
          <CreateTeam onCreated={setTeam} />
        ) : (
          <Dashboard team={team} onTeamUpdate={setTeam} />
        )}
      </main>
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} TeamPortal Event Management System. Built for Attendees.
        </div>
      </footer>
    </div>
  );
};

export default App;
