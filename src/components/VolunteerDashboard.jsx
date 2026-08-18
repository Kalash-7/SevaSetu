import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const locationOptions = [
  { name: 'Aminabad Market', lat: 26.8415, lng: 80.9231 },
  { name: 'Gomti Nagar', lat: 26.8606, lng: 80.9873 },
  { name: 'Hazratganj', lat: 26.8504, lng: 80.9389 },
  { name: 'Alambagh', lat: 26.8043, lng: 80.9004 }
];

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(locationOptions[0]);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [isFindingMatches, setIsFindingMatches] = useState(false);

  // Vision AI States
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCompletedTask, setSelectedCompletedTask] = useState(null);

  const currentUserEmail = auth.currentUser?.email;
  const activeDeployment = tasks.find(t => t.assignedTo === currentUserEmail && t.status !== 'completed');
  const availableTasks = tasks.filter(t => t.status === 'ongoing');
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.assignedTo === currentUserEmail);

  const [userSkills, setUserSkills] = useState(['Medical', 'Transport', 'Logistics']);
  const [newSkill, setNewSkill] = useState('');

  const calculateMatchScore = (taskSkills = []) => {
    if (taskSkills.length === 0) return 0;
    const userSet = new Set(userSkills.map(s => s.toLowerCase()));
    const taskSet = new Set(taskSkills.map(s => s.toLowerCase()));
    const intersectionSize = [...taskSet].filter(x => userSet.has(x)).length;
    return Math.round((intersectionSize / taskSet.size) * 100);
  };

  const sortedAvailableTasks = availableTasks.map(t => ({
    ...t,
    matchScore: calculateMatchScore(t.skills)
  })).sort((a, b) => b.matchScore - a.matchScore);

  const tasksToDisplay = aiRecommendations
    ? aiRecommendations.map(rec => ({
      ...availableTasks.find(t => t.id === rec.taskId),
      matchScore: rec.matchScore,
      aiReasoning: rec.aiReasoning
    })).filter(t => t.id)
    : sortedAvailableTasks;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'emergencies'), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    });
    return () => unsubscribe();
  }, []);

  const handleClaimTask = async (taskId) => {
    if (!currentUserEmail) return;
    try {
      await updateDoc(doc(db, 'emergencies', taskId), {
        status: 'claimed',
        assignedTo: currentUserEmail
      });
    } catch (error) {
      console.error("Error claiming task: ", error);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'emergencies', taskId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: { data: base64Data, mimeType: file.type }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerateReport = async () => {
    if (!selectedFile || !selectedCompletedTask) return;

    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      alert("Missing Gemini API Key! Please check your .env file and completely RESTART the Vite dev server (Ctrl+C then npm run dev).");
      return;
    }

    setIsAnalyzing(true);
    try {
      const imagePart = await fileToGenerativePart(selectedFile);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const prompt = 'Extract the details from this field report image into a professional, short bulleted summary focusing on Situation and Actions Taken.';

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      await updateDoc(doc(db, 'emergencies', selectedCompletedTask), {
        aiSummary: responseText
      });

      setSelectedCompletedTask(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error analyzing image: ", error);
      alert("AI Analysis Failed: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSmartMatch = async () => {
    setIsFindingMatches(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const prompt = `You are an emergency dispatcher AI. The volunteer is located at ${currentLocation.name} and has these skills:${userSkills.join(', ')}. Here are the active emergencies: ${JSON.stringify(availableTasks)}. Analyze semantic skill overlap (e.g. 'First Aid' matches 'Medical') and location proximity. Return ONLY a valid JSON array of objects with keys: taskId, matchScore (number 0-100), and aiReasoning (a 1-sentence explanation of why they are a good fit). Do not include markdown formatting or backticks, just the raw JSON.`;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const recommendations = JSON.parse(responseText);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error("AI Match Error: ", error);
      alert("AI Match Failed: " + error.message);
    } finally {
      setIsFindingMatches(false);
    }
  };

  const openDirections = (taskLat, taskLng) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${taskLat},${taskLng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-teal-600 font-extrabold text-xl md:text-2xl tracking-tight hidden sm:inline-block">SevaSetu</span>
            <span className="text-teal-600 font-extrabold text-xl tracking-tight sm:hidden">SS</span>
            <span className="text-slate-600 font-semibold text-base md:text-lg border-l-2 border-slate-200 pl-2">Volunteer</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors hidden sm:inline-block mr-2">Home</button>

            {/* My Location Dropdown */}
            <div className="hidden md:flex items-center gap-1.5 mr-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <select
                value={currentLocation.name}
                onChange={(e) => setCurrentLocation(locationOptions.find(l => l.name === e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {locationOptions.map((loc, idx) => (
                  <option key={idx} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-slate-400'}`}>
                {isAvailable ? 'Available Now' : 'Offline'}
              </span>
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold border border-teal-200 cursor-pointer hover:bg-teal-200 transition-colors shadow-inner">
              VO
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* My Profile */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
          <h2 className="text-xl font-extrabold text-slate-800">My Profile</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">My Skills</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {userSkills.map((skill, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                    {skill}
                    <button
                      onClick={() => setUserSkills(userSkills.filter((_, i) => i !== idx))}
                      className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </span>
                ))}
                {userSkills.length === 0 && <span className="text-sm text-slate-400 italic">No skills added yet.</span>}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newSkill.trim() && !userSkills.some(s => s.toLowerCase() === newSkill.trim().toLowerCase())) {
                        setUserSkills([...userSkills, newSkill.trim()]);
                        setNewSkill('');
                      }
                    }
                  }}
                  placeholder="Add a new skill..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() => {
                    if (newSkill.trim() && !userSkills.some(s => s.toLowerCase() === newSkill.trim().toLowerCase())) {
                      setUserSkills([...userSkills, newSkill.trim()]);
                      setNewSkill('');
                    }
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition-colors"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Active Deployment */}
        {activeDeployment && (
          <section className="mb-4">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
              Active Deployment
            </h2>
            <div className="bg-blue-50 rounded-2xl p-6 shadow-md border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{activeDeployment.title}</h3>
                <p className="text-blue-800 font-medium text-sm">
                  Status: <span className="uppercase font-bold">{activeDeployment.status.replace('_', ' ')}</span>
                </p>
              </div>
              <div className="w-full md:w-auto">
                {activeDeployment.status === 'claimed' && (
                  <button
                    onClick={() => handleUpdateStatus(activeDeployment.id, 'en_route')}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg transition-all"
                  >
                    Mark En Route
                  </button>
                )}
                {activeDeployment.status === 'en_route' && (
                  <button
                    onClick={() => handleUpdateStatus(activeDeployment.id, 'arrived')}
                    className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg transition-all"
                  >
                    Mark Arrived
                  </button>
                )}
                {activeDeployment.status === 'arrived' && (
                  <button
                    onClick={() => handleUpdateStatus(activeDeployment.id, 'completed')}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg transition-all"
                  >
                    Complete Task
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Available Listings */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-2xl font-extrabold text-slate-800">Available Listings</h2>
          </div>

          <button
            onClick={handleSmartMatch}
            disabled={isFindingMatches || availableTasks.length === 0}
            className="w-full mb-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isFindingMatches ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analyzing semantic skills and proximity...
              </>
            ) : (
              <>
                <span className="text-2xl">✨</span>
                Run AI Smart Match
              </>
            )}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isAvailable ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 font-medium">You are currently offline. Toggle availability to view urgent deployments.</p>
              </div>
            ) : tasksToDisplay.length === 0 ? (
              <p className="text-slate-500 italic col-span-full">No available tasks right now.</p>
            ) : (
              tasksToDisplay.map(task => (
                <div key={task.id} className={`bg-white rounded-2xl p-6 shadow-md border ${task.aiReasoning ? 'border-teal-400 ring-2 ring-teal-50' : 'border-slate-100'} relative overflow-hidden flex flex-col justify-between`}>
                  <div>
                    <div className={`absolute top-0 right-0 font-extrabold px-4 py-1.5 rounded-bl-2xl text-sm shadow-sm ${task.matchScore >= 80 ? 'bg-green-100 text-green-700' :
                      task.matchScore >= 40 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                      {task.matchScore}% MATCH
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1 pr-16">{task.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 flex items-center gap-1 font-medium">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {task.locationName || 'Near you'}
                    </p>

                    {task.aiReasoning && (
                      <div className="mb-4 bg-teal-50 p-3 rounded-lg border border-teal-100">
                        <p className="text-xs font-bold text-teal-800 flex items-center gap-1 mb-1">
                          <span className="text-sm">✨</span> AI Match Reason
                        </p>
                        <p className="text-sm text-teal-700 font-medium leading-tight">{task.aiReasoning}</p>
                      </div>
                    )}

                    {task.skills && task.skills.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Critical Skills Needed</p>
                        <div className="flex gap-2 flex-wrap">
                          {task.skills.map((skill, idx) => (
                            <span key={idx} className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    {task.lat && task.lng && (
                      task.lat === currentLocation.lat && task.lng === currentLocation.lng ? (
                        <div className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-xl border border-green-200 text-center flex items-center justify-center gap-2 shadow-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          You are in the required location
                        </div>
                      ) : (
                        <button
                          onClick={() => openDirections(task.lat, task.lng)}
                          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-200 shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">🗺️</span> Get Directions
                        </button>
                      )
                    )}
                    
                    {!activeDeployment && (
                      <button
                        onClick={() => handleClaimTask(task.id)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-4 rounded-xl text-lg shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 transition-all duration-200"
                      >
                        CLAIM TASK
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Completed Actions */}
        <section className="mt-2 mb-8">
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">Completed Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedTasks.length === 0 && (
              <p className="text-slate-500 italic col-span-full">You have not completed any tasks yet.</p>
            )}
            {completedTasks.map(task => (
              <div key={task.id} className="bg-slate-100 border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-inner h-full">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-green-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 text-lg">{task.title}</h3>
                <p className="text-slate-500 text-sm mb-4 font-medium">Thank you for your service!</p>

                {task.aiSummary ? (
                  <div className="mt-4 text-left bg-white p-5 rounded-xl border border-slate-200 text-sm text-slate-700 w-full shadow-sm hover:shadow transition-shadow">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      AI Vision Summary
                    </h4>
                    <div className="whitespace-pre-wrap font-medium text-slate-600 leading-relaxed max-h-60 overflow-y-auto">{task.aiSummary}</div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedCompletedTask(task.id)}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    Upload Post-Action Form
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Upload Field Report Modal */}
      {selectedCompletedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Upload Field Report</h3>
            <p className="text-sm text-slate-500 mb-6">Take a photo of your handwritten log or field notes. Our Vision AI will automatically extract and summarize the details.</p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 mb-6"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setSelectedCompletedTask(null); setSelectedFile(null); }}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={!selectedFile || isAnalyzing}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Run Vision AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
