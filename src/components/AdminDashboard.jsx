import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const locationOptions = [
  { name: 'Aminabad Market', lat: 26.8415, lng: 80.9231 },
  { name: 'Gomti Nagar', lat: 26.8606, lng: 80.9873 },
  { name: 'Hazratganj', lat: 26.8504, lng: 80.9389 },
  { name: 'Alambagh', lat: 26.8043, lng: 80.9004 }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newResources, setNewResources] = useState('');
  const [newLocation, setNewLocation] = useState(locationOptions[0].name);

  useEffect(() => {
    const q = query(collection(db, 'emergencies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emergenciesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmergencies(emergenciesData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddEmergency = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const selectedLocation = locationOptions.find(loc => loc.name === newLocation) || locationOptions[0];
      await addDoc(collection(db, 'emergencies'), {
        title: newTitle,
        skills: newSkills.split(',').map(s => s.trim()).filter(Boolean),
        resources: newResources,
        locationName: selectedLocation.name,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        status: 'ongoing',
        createdAt: new Date().toISOString()
      });
      setNewTitle('');
      setNewSkills('');
      setNewResources('');
      setNewLocation(locationOptions[0].name);
    } catch (error) {
      console.error("Error adding emergency: ", error);
    }
  };

  const getStatusClasses = (status) => {
    const map = {
      ongoing: 'bg-yellow-50 text-yellow-600',
      claimed: 'bg-blue-50 text-blue-600',
      en_route: 'bg-purple-50 text-purple-600',
      arrived: 'bg-green-50 text-green-600'
    };
    return map[status] || 'bg-slate-50 text-slate-600';
  };

  const getIndicatorColor = (status) => {
    const map = {
      ongoing: 'bg-yellow-500',
      claimed: 'bg-blue-500',
      en_route: 'bg-purple-500',
      arrived: 'bg-green-500'
    };
    return map[status] || 'bg-slate-300';
  };

  const getCardBorder = (status) => {
    const map = {
      ongoing: 'border-yellow-200',
      claimed: 'border-blue-200',
      en_route: 'border-purple-200',
      arrived: 'border-green-200'
    };
    return map[status] || 'border-slate-100';
  };

  const formatStatus = (status) => status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-teal-600 font-extrabold text-2xl tracking-tight">SevaSetu</span>
            <span className="text-slate-600 font-semibold text-lg border-l-2 border-slate-200 pl-2">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors hidden sm:inline-block">Home</button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold border border-teal-200 cursor-pointer hover:bg-teal-200 transition-colors">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Top Section: Map & Deploy Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Live Map View (Left, 2 columns) */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[500px] relative">

              {/* Map Header */}
              <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow border border-slate-100 pointer-events-auto">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                    Live Operations Map
                  </span>
                </div>
              </div>

              {/* Live Map */}
              <div className="h-[calc(100%-1rem)] m-2 rounded-xl overflow-hidden relative z-0">
                <MapContainer center={[26.8467, 80.9462]} zoom={12} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                  <ZoomControl position="topright" />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {emergencies.filter(e => e.status !== 'completed').map((task) => {
                    if (task.lat && task.lng) {
                      return (
                        <Marker key={task.id} position={[task.lat, task.lng]}>
                          <Popup>
                            <strong>{task.title}</strong><br />
                            {task.locationName}<br />
                            Status: {formatStatus(task.status)}
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })}
                </MapContainer>
              </div>

            </div>
          </div>

          {/* Quick Deploy Form (Right, 1 column) */}
          <div className="lg:col-span-1 flex flex-col">
            <form onSubmit={handleAddEmergency} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4 h-full">
              <h3 className="font-bold text-slate-800 text-xl mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Deploy Emergency
              </h3>

              <div className="space-y-3 flex-1">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Emergency Title"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition-colors"
                  required
                />
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  placeholder="Skills Needed (e.g. Medical, Transport)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition-colors"
                />
                <input
                  type="text"
                  value={newResources}
                  onChange={(e) => setNewResources(e.target.value)}
                  placeholder="Resources Needed"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition-colors"
                />
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 transition-colors cursor-pointer"
                >
                  {locationOptions.map((loc, idx) => (
                    <option key={idx} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 transition-all duration-200 mt-2">
                CREATE DEPLOYMENT
              </button>
            </form>
          </div>
        </div>

        {/* Ongoing Actions */}
        <section className="mt-4">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            Ongoing Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emergencies.filter(e => e.status !== 'completed').length === 0 && (
              <p className="text-slate-500 italic col-span-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">No active emergencies.</p>
            )}
            {emergencies.filter(e => e.status !== 'completed').map((emergency) => (
              <div key={emergency.id} className={`bg-white rounded-2xl p-6 shadow-md border ${getCardBorder(emergency.status)} hover:shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between hover:-translate-y-1`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full ${getIndicatorColor(emergency.status)}`}></div>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-slate-900 pr-2">{emergency.title}</h3>
                    <span className={`text-xs font-extrabold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-sm ${getStatusClasses(emergency.status)}`}>
                      {formatStatus(emergency.status)}
                    </span>
                  </div>

                  {emergency.assignedTo && (
                    <p className="text-sm font-semibold text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Assigned to: <span className="text-slate-800 font-bold">{emergency.assignedTo}</span>
                    </p>
                  )}

                  {(emergency.locationName || emergency.resources) && (
                    <div className="text-sm text-slate-600 mb-4 space-y-2">
                      {emergency.locationName && (
                        <p className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          {emergency.locationName}
                        </p>
                      )}
                      {emergency.resources && (
                        <p className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                          {emergency.resources}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {emergency.skills && emergency.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                    {emergency.skills.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-md border border-teal-100 shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Completed Actions */}
        <section className="mb-8 mt-4">
          <h2 className="text-xl font-extrabold text-slate-700 mb-6">Completed Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emergencies.filter(e => e.status === 'completed').length === 0 && (
              <p className="text-slate-500 italic col-span-full">No completed emergencies.</p>
            )}
            {emergencies.filter(e => e.status === 'completed').map((emergency) => (
              <div key={emergency.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-slate-800 pr-2">{emergency.title}</h3>
                    <span className="text-xs font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-sm">COMPLETED</span>
                  </div>
                  {emergency.assignedTo && (
                    <p className="text-sm font-semibold text-slate-500 mb-4">
                      Assigned to: {emergency.assignedTo}
                    </p>
                  )}

                  {(emergency.locationName || emergency.resources) && (
                    <div className="text-sm text-slate-500 mb-4 space-y-2">
                      {emergency.locationName && (
                        <p className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          {emergency.locationName}
                        </p>
                      )}
                      {emergency.resources && (
                        <p className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                          {emergency.resources}
                        </p>
                      )}
                    </div>
                  )}

                  {emergency.skills && emergency.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {emergency.skills.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {emergency.aiSummary && (
                  <div className="mt-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-text hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      AI Vision Summary
                    </h4>
                    <div className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">{emergency.aiSummary}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
