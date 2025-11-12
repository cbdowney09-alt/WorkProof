import React, { useState, useEffect } from 'react';
import { Clock, Briefcase, Calendar, Camera, Download, Plus, TrendingUp, X, Check, Crown, Share2 } from 'lucide-react';
import localforage from "localforage";
export default function WorkProofApp() {
  const [mode, setMode] = useState('free');
  const [view, setView] = useState('dashboard');
  const [positions, setPositions] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [newPosition, setNewPosition] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [currentShift, setCurrentShift] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    positionId: '',
    timecardPhoto: null,
    photoPreview: null
  });

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Check if app is installed
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const posResult = await window.storage.get('positions');
        const shiftResult = await window.storage.get('shifts');
        const modeResult = await window.storage.get('subscription-mode');
        
        if (posResult) setPositions(JSON.parse(posResult.value));
        if (shiftResult) setShifts(JSON.parse(shiftResult.value));
        if (modeResult) setMode(modeResult.value);
      } catch (error) {
        console.log('First time user - no data to load');
      }
    };
    loadData();
  }, []);

  const savePositions = async (newPositions) => {
    setPositions(newPositions);
    await window.storage.set('positions', JSON.stringify(newPositions));
  };

  const saveShifts = async (newShifts) => {
    setShifts(newShifts);
    await window.storage.set('shifts', JSON.stringify(newShifts));
  };

  const saveMode = async (newMode) => {
    setMode(newMode);
    await window.storage.set('subscription-mode', newMode);
  };

  const addPosition = () => {
    if (newPosition.trim()) {
      const position = {
        id: Date.now().toString(),
        name: newPosition.trim()
      };
      savePositions([...positions, position]);
      setNewPosition('');
    }
  };

  const deletePosition = (id) => {
    savePositions(positions.filter(p => p.id !== id));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentShift({
          ...currentShift,
          timecardPhoto: file.name,
          photoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const totalMinutes = endMinutes - startMinutes;
    return totalMinutes / 60;
  };

  const addShift = () => {
    if (currentShift.startTime && currentShift.endTime && currentShift.positionId) {
      const hours = calculateHours(currentShift.startTime, currentShift.endTime);
      const shift = {
        id: Date.now().toString(),
        ...currentShift,
        hours
      };
      saveShifts([...shifts, shift]);
      setCurrentShift({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        positionId: '',
        timecardPhoto: null,
        photoPreview: null
      });
      setView('dashboard');
    }
  };

  const deleteShift = (id) => {
    saveShifts(shifts.filter(s => s.id !== id));
  };

  const getTotalHours = () => {
    return shifts.reduce((sum, shift) => sum + shift.hours, 0).toFixed(1);
  };

  const getHoursByPosition = () => {
    const byPosition = {};
    shifts.forEach(shift => {
      const position = positions.find(p => p.id === shift.positionId);
      if (position) {
        byPosition[position.name] = (byPosition[position.name] || 0) + shift.hours;
      }
    });
    return byPosition;
  };

  const getWeeks = () => {
    const weeks = [];
    const sortedShifts = [...shifts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const weekStart = new Date(shiftDate);
      weekStart.setDate(shiftDate.getDate() - shiftDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks.find(w => w.key === weekKey)) {
        weeks.push({
          key: weekKey,
          label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          shifts: []
        });
      }
      
      const week = weeks.find(w => w.key === weekKey);
      week.shifts.push(shift);
    });
    
    return weeks;
  };

  const weeks = getWeeks();

  // iOS Share instruction for install
  const showIOSInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS && !isInstalled;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Download size={20} />
              </div>
              <div>
                <p className="font-semibold">Install WorkProof</p>
                <p className="text-sm text-blue-100">Add to your home screen for easy access</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions */}
      {showIOSInstallInstructions() && !showInstallPrompt && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start gap-3">
              <Share2 size={20} className="mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Install on iPhone</p>
                <p className="text-purple-100">
                  Tap the <span className="inline-flex items-center mx-1"><Share2 size={14} /></span> Share button below, then tap "Add to Home Screen"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
                <Clock className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">WorkProof</h1>
                <p className="text-sm text-slate-500">Professional Hours Tracking</p>
              </div>
            </div>
            <button
              onClick={() => saveMode(mode === 'free' ? 'premium' : 'free')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'premium'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Crown size={18} />
              {mode === 'premium' ? 'Premium' : 'Upgrade'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'add-shift', label: 'Add Shift', icon: Plus },
              { id: 'positions', label: 'Positions', icon: Briefcase },
              { id: 'export', label: 'Export', icon: Download }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
                    view === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total Hours</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{getTotalHours()}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Shifts Logged</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{shifts.length}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Calendar className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Positions</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{positions.length}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Briefcase className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Hours by Position */}
            {positions.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Hours by Position</h2>
                <div className="space-y-3">
                  {Object.entries(getHoursByPosition()).map(([position, hours]) => (
                    <div key={position} className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium">{position}</span>
                      <span className="text-slate-900 font-semibold">{hours.toFixed(1)} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly View */}
            {weeks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">Weekly Breakdown</h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {weeks.map((week, idx) => (
                    <div key={week.key} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">
                          Week of {week.label}
                        </h3>
                        <span className="text-sm font-medium text-slate-600">
                          {week.shifts.reduce((sum, s) => sum + s.hours, 0).toFixed(1)} hours
                        </span>
                      </div>
                      <div className="space-y-3">
                        {week.shifts.map(shift => {
                          const position = positions.find(p => p.id === shift.positionId);
                          return (
                            <div key={shift.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <div className="bg-blue-100 px-3 py-1 rounded-full">
                                    <span className="text-sm font-medium text-blue-700">{position?.name}</span>
                                  </div>
                                  <span className="text-slate-600 text-sm">
                                    {new Date(shift.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 flex-wrap">
                                  <span>{shift.startTime} - {shift.endTime}</span>
                                  <span className="font-semibold text-slate-900">{shift.hours.toFixed(1)} hrs</span>
                                  {shift.timecardPhoto && (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <Camera size={14} />
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteShift(shift.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shifts.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-slate-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No shifts logged yet</h3>
                <p className="text-slate-600 mb-6">Start tracking your work hours to build your professional record</p>
                <button
                  onClick={() => setView('add-shift')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Log Your First Shift
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'add-shift' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Log a Shift</h2>
                <p className="text-blue-100">Add your work hours with timecard proof</p>
              </div>

              <div className="p-6 space-y-6">
                {mode === 'premium' && (
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Crown className="text-amber-600 mt-0.5" size={20} />
                      <div>
                        <p className="font-semibold text-amber-900">AI Auto-Extract Available</p>
                        <p className="text-sm text-amber-700 mt-1">Upload a timecard photo and we'll automatically extract your hours</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={currentShift.date}
                    onChange={(e) => setCurrentShift({...currentShift, date: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={currentShift.startTime}
                      onChange={(e) => setCurrentShift({...currentShift, startTime: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={currentShift.endTime}
                      onChange={(e) => setCurrentShift({...currentShift, endTime: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                  <select
                    value={currentShift.positionId}
                    onChange={(e) => setCurrentShift({...currentShift, positionId: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a position</option>
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                  {positions.length === 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      No positions yet. <button onClick={() => setView('positions')} className="text-blue-600 hover:underline">Add one here</button>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Timecard Photo <span className="text-slate-500">(Optional but recommended)</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      {currentShift.photoPreview ? (
                        <div className="space-y-3">
                          <img src={currentShift.photoPreview} alt="Timecard" className="max-h-48 mx-auto rounded-lg" />
                          <p className="text-sm text-green-600 font-medium">Photo uploaded ✓</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Camera className="mx-auto text-slate-400" size={40} />
                          <div>
                            <p className="font-medium text-slate-700">Upload timecard photo</p>
                            <p className="text-sm text-slate-500">Proof for your resume</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={addShift}
                    disabled={!currentShift.startTime || !currentShift.endTime || !currentShift.positionId}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Log Shift
                  </button>
                  <button
                    onClick={() => setView('dashboard')}
                    className="px-6 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'positions' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Job Positions</h2>
                <p className="text-purple-100">Manage the roles you work at Cookout</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                    placeholder="e.g., Cashier, Grill Cook, Drive-thru"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={addPosition}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Add
                  </button>
                </div>

                {positions.length > 0 ? (
                  <div className="space-y-2">
                    {positions.map(pos => (
                      <div key={pos.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Briefcase className="text-purple-600" size={20} />
                          </div>
                          <span className="font-medium text-slate-900">{pos.name}</span>
                        </div>
                        <button
                          onClick={() => deletePosition(pos.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-600">No positions added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'export' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Export for Resume</h2>
                <p className="text-green-100">Professional summary of your work hours</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Work Summary</h3>
                  <div className="space-y-3 text-slate-700">
                    <p><span className="font-medium">Total Hours Worked:</span> {getTotalHours()} hours</p>
                    <p><span className="font-medium">Total Shifts:</span> {shifts.length}</p>
                    <p><span className="font-medium">Date Range:</span> {
                      shifts.length > 0 
                        ? `${new Date(Math.min(...shifts.map(s => new Date(s.date)))).toLocaleDateString()} - ${new Date(Math.max(...shifts.map(s => new Date(s.date)))).toLocaleDateString()}`
                        : 'No shifts logged'
                    }</p>
                    
                    {positions.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Hours by Position:</p>
                        <div className="pl-4 space-y-1">
                          {Object.entries(getHoursByPosition()).map(([position, hours]) => (
                            <p key={position}>• {position}: {hours.toFixed(1)} hours</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Pro tip:</span> All your timecard photos are stored as proof. You can reference specific weeks and dates when employers ask for verification.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const summary = `Work Hours Summary\n\nTotal Hours: ${getTotalHours()}\nTotal Shifts: ${shifts.length}\n\nPositions:\n${Object.entries(getHoursByPosition()).map(([p, h]) => `- ${p}: ${h.toFixed(1)} hours`).join('\n')}`;
                    navigator.clipboard.writeText(summary);
                    alert('Summary copied to clipboard!');
                  }}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Copy Summary to Clipboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}
