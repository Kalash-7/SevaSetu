import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (email.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/volunteer');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 hover:shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Home
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-8 transform transition-all">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 text-teal-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.092 2.027-.267 3.018m-2.922 7.029c-1.42.06-2.84.06-4.26.06h-.04m-5.46-3.87C3.125 15.657 2 13.435 2 11a10 10 0 1120 0c0 2.435-1.125 4.657-3.04 6.13m-2.922-7.029C15.827 12.11 14 13.75 14 15.75c0 .35.03.693.088 1.026M10 11V8a2 2 0 114 0v3m-4 0a2 2 0 104 0m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Secure Login</h2>
          <p className="text-slate-500 font-medium">Access your SevaSetu dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 mt-4"
          >
            Log In
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 text-center animate-pulse">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
