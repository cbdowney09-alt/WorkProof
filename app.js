<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WorkProof</title>

  <!-- Tailwind (development CDN) -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React and Babel -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- lucide-react (icon library) -->
  <script src="https://unpkg.com/lucide-react@latest/dist/lucide-react.min.js"></script>

  <!-- localforage for persistent storage -->
  <script src="https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js"></script>

  <script>
    // Simple wrapper for local storage (used by your app)
    window.storage = {
      async set(key, value) { return localforage.setItem(key, value); },
      async get(key) {
        const value = await localforage.getItem(key);
        if (value === null) return null;
        return { value: typeof value === "string" ? value : JSON.stringify(value) };
      },
      async delete(key) { return localforage.removeItem(key); }
    };
  </script>

  <link rel="manifest" href="manifest.json" />
  <link rel="icon" href="icon-512.png" type="image/png" />
</head>

<body class="bg-slate-50">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    const {
      Clock, Briefcase, Calendar, Camera, Download, Plus, TrendingUp,
      X, Check, Crown, Share2, LogOut, User, Lock, Mail
    } = lucideReact;

    function WorkProofApp() {
      // === STATE ===
      const [authView, setAuthView] = useState('login');
      const [currentUser, setCurrentUser] = useState(null);
      const [authForm, setAuthForm] = useState({ email: '', password: '', confirmPassword: '', name: '' });
      const [authError, setAuthError] = useState('');
      const [authLoading, setAuthLoading] = useState(false);
      const [mode, setMode] = useState('free');
      const [view, setView] = useState('dashboard');
      const [positions, setPositions] = useState([]);
      const [shifts, setShifts] = useState([]);
      const [newPosition, setNewPosition] = useState('');
      const [showInstallPrompt, setShowInstallPrompt] = useState(false);
      const [deferredPrompt, setDeferredPrompt] = useState(null);
      const [currentShift, setCurrentShift] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '', endTime: '', positionId: '', timecardPhoto: null, photoPreview: null
      });

      // === AUTH ===
      useEffect(() => { checkSession(); }, []);
      const checkSession = async () => {
        try {
          const sessionResult = await window.storage.get('current-user');
          if (sessionResult) {
            const user = JSON.parse(sessionResult.value);
            setCurrentUser(user);
            setAuthView('app');
            await loadUserData(user.id);
          }
        } catch {
          console.log('No active session');
        }
      };

      const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      const handleSignup = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthLoading(true);
        try {
          if (!authForm.email || !authForm.password || !authForm.name)
            throw new Error('All fields are required');
          if (authForm.password !== authForm.confirmPassword)
            throw new Error('Passwords do not match');
          if (authForm.password.length < 6)
            throw new Error('Password must be at least 6 characters');

          const userKey = `user-email-${authForm.email.toLowerCase()}`;
          const existingUser = await window.storage.get(userKey);
          if (existingUser) throw new Error('An account with this email already exists');

          const userId = Date.now().toString();
          const hashedPassword = await hashPassword(authForm.password);
          const newUser = {
            id: userId, email: authForm.email.toLowerCase(),
            name: authForm.name, passwordHash: hashedPassword, createdAt: new Date().toISOString()
          };

          await window.storage.set(userKey, JSON.stringify(newUser));
          await window.storage.set(`user-id-${userId}`, JSON.stringify(newUser));
          await window.storage.set('current-user', JSON.stringify(newUser));

          setCurrentUser(newUser);
          setAuthView('app');
        } catch (err) {
          setAuthError(err.message);
        } finally {
          setAuthLoading(false);
        }
      };

      const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthLoading(true);
        try {
          if (!authForm.email || !authForm.password)
            throw new Error('Email and password are required');

          const userKey = `user-email-${authForm.email.toLowerCase()}`;
          const userResult = await window.storage.get(userKey);
          if (!userResult) throw new Error('Invalid email or password');

          const user = JSON.parse(userResult.value);
          const hashedPassword = await hashPassword(authForm.password);
          if (user.passwordHash !== hashedPassword)
            throw new Error('Invalid email or password');

          await window.storage.set('current-user', JSON.stringify(user));
          setCurrentUser(user);
          setAuthView('app');
          await loadUserData(user.id);
        } catch (err) {
          setAuthError(err.message);
        } finally {
          setAuthLoading(false);
        }
      };

      const handleLogout = async () => {
        await window.storage.delete('current-user');
        setCurrentUser(null);
        setAuthView('login');
        setPositions([]);
        setShifts([]);
        setMode('free');
        setView('dashboard');
      };

      const loadUserData = async (userId) => {
        try {
          const pos = await window.storage.get(`user-${userId}-positions`);
          const sh = await window.storage.get(`user-${userId}-shifts`);
          const md = await window.storage.get(`user-${userId}-mode`);
          if (pos) setPositions(JSON.parse(pos.value));
          if (sh) setShifts(JSON.parse(sh.value));
          if (md) setMode(md.value);
        } catch { console.log('No user data'); }
      };

      const savePositions = async (p) => { setPositions(p); if (currentUser) await window.storage.set(`user-${currentUser.id}-positions`, JSON.stringify(p)); };
      const saveShifts = async (s) => { setShifts(s); if (currentUser) await window.storage.set(`user-${currentUser.id}-shifts`, JSON.stringify(s)); };
      const saveMode = async (m) => { setMode(m); if (currentUser) await window.storage.set(`user-${currentUser.id}-mode`, m); };

      // === PWA INSTALL ===
      useEffect(() => {
        const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShowInstallPrompt(true); };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
      }, []);
      const handleInstall = async () => { if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; setDeferredPrompt(null); setShowInstallPrompt(false); } };

      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      const showIOSInstallInstructions = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !isInstalled;

      // === APP LOGIC ===
      const addPosition = () => { if (newPosition.trim()) { const p = { id: Date.now().toString(), name: newPosition.trim() }; savePositions([...positions, p]); setNewPosition(''); } };
      const deletePosition = (id) => savePositions(positions.filter(p => p.id !== id));
      const calculateHours = (start, end) => {
        if (!start || !end) return 0;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let startM = sh * 60 + sm, endM = eh * 60 + em;
        if (endM < startM) endM += 1440;
        return (endM - startM) / 60;
      };
      const addShift = () => {
        if (currentShift.startTime && currentShift.endTime && currentShift.positionId) {
          const hours = calculateHours(currentShift.startTime, currentShift.endTime);
          const shift = { id: Date.now().toString(), ...currentShift, hours };
          saveShifts([...shifts, shift]);
          setCurrentShift({
            date: new Date().toISOString().split('T')[0],
            startTime: '', endTime: '', positionId: '', timecardPhoto: null, photoPreview: null
          });
          setView('dashboard');
        }
      };
      const deleteShift = (id) => saveShifts(shifts.filter(s => s.id !== id));
      const getTotalHours = () => shifts.reduce((sum, s) => sum + s.hours, 0).toFixed(1);
      const getHoursByPosition = () => {
        const byPos = {};
        shifts.forEach(s => {
          const pos = positions.find(p => p.id === s.positionId);
          if (pos) byPos[pos.name] = (byPos[pos.name] || 0) + s.hours;
        });
        return byPos;
      };
      const weeks = (() => {
        const w = [];
        const sorted = [...shifts].sort((a, b) => new Date(b.date) - new Date(a.date));
        sorted.forEach(s => {
          const d = new Date(s.date);
          const start = new Date(d); start.setDate(d.getDate() - d.getDay());
          const key = start.toISOString().split('T')[0];
          if (!w.find(x => x.key === key))
            w.push({ key, label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), shifts: [] });
          w.find(x => x.key === key).shifts.push(s);
        });
        return w;
      })();

      // === AUTH SCREEN ===
      if (authView !== 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl shadow-lg inline-block mb-4">
                  <Clock className="text-white" size={48}/>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">WorkProof</h1>
                <p className="text-slate-600">Track your work hours professionally</p>
              </div>
              {authError && <p className="text-red-600 mb-4">{authError}</p>}
              <form onSubmit={authView === 'login' ? handleLogin : handleSignup} className="space-y-4">
                {authView === 'signup' &&
                  <input className="w-full p-3 border rounded" placeholder="Full Name"
                    value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })}/>}
                <input type="email" className="w-full p-3 border rounded" placeholder="Email"
                  value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })}/>
                <input type="password" className="w-full p-3 border rounded" placeholder="Password"
                  value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })}/>
                {authView === 'signup' &&
                  <input type="password" className="w-full p-3 border rounded" placeholder="Confirm Password"
                    value={authForm.confirmPassword} onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })}/>}
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                  {authLoading ? 'Processing...' : authView === 'login' ? 'Login' : 'Create Account'}
                </button>
              </form>
              <p className="text-center text-sm mt-4">
                {authView === 'login' ? 'No account? ' : 'Have an account? '}
                <button className="text-blue-600" onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')}>
                  {authView === 'login' ? 'Sign up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        );
      }

      // === MAIN APP UI (shortened for brevity) ===
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl"><Clock className="text-white" size={24}/></div>
                <div><h1 className="text-xl font-bold">WorkProof</h1><p className="text-sm">Welcome, {currentUser?.name}</p></div>
              </div>
              <button onClick={handleLogout} className="bg-slate-200 px-4 py-2 rounded">Logout</button>
            </div>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <p>Total Hours Worked: {getTotalHours()}</p>
            <p>Positions: {positions.length}</p>
          </div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<WorkProofApp />);
  </script>
</body>
</html>
