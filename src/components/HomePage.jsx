import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-center max-w-3xl mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Welcome to <span className="text-teal-600">SevaSetu</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
          Rapid Volunteer & Resource Coordination for Emergency Response
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl justify-center">

        {/* Volunteer Card */}
        <div onClick={() => navigate('/login', { state: { role: 'volunteer' } })} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[280px] border border-slate-100 group">
          <div className="bg-teal-50 p-4 rounded-full mb-6 group-hover:bg-teal-100 transition-colors">
            <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
            Volunteer
          </h2>
          <p className="text-slate-500 text-center">
            Join the workforce, offer your skills, and help on the ground.
          </p>
        </div>

        {/* NGO / Admin Card */}
        <div onClick={() => navigate('/login', { state: { role: 'admin' } })} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[280px] border border-slate-100 group">
          <div className="bg-teal-50 p-4 rounded-full mb-6 group-hover:bg-teal-100 transition-colors">
            <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
            NGO / Admin
          </h2>
          <p className="text-slate-500 text-center">
            Manage resources, coordinate efforts, and oversee operations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
