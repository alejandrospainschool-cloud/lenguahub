// src/modules/auth/Login.jsx
import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth, provider, signInAsGuest, signInWithEmail, signUpWithEmail } from '../../lib/firebase';
import { 
  Brain, Globe, Timer, Sparkles, BookOpen, Zap, CheckCircle2, ArrowRight, Crown, Zap as Zap2, Mail, Lock
} from 'lucide-react';
import logo from '../../logo.png'; 

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('google'); // 'google', 'login', 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        sessionStorage.setItem("google_access_token", credential.accessToken);
        navigate('/'); 
      } else {
        setError("Login successful, but Google didn't return a token. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login Failed:", err);
      setLoading(false);
      setError("Login Error: " + err.message);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAsGuest();
      navigate('/');
    } catch (err) {
      console.error("Guest sign-in failed:", err);
      setLoading(false);
      setError("Guest sign-in failed: " + err.message);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err) {
      console.error("Email sign-in failed:", err);
      setLoading(false);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message);
      }
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      navigate('/');
    } catch (err) {
      console.error("Email sign-up failed:", err);
      setLoading(false);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="absolute top-0 left-0 right-0 z-50 py-6 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Olé Learning" className="w-10 h-10 rounded-lg shadow-lg" />
          <span className="font-bold text-xl tracking-tight hidden md:block">Olé Learning</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 min-h-[90vh] flex items-center">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* Left Column: Copywriting */}
          <div className="space-y-8 text-center lg:text-left animate-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 font-bold text-sm border border-blue-500/20 mb-4">
              <Globe size={16} /> Your language journey starts here
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Learn Spanish, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                your way.
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Build your own vocabulary collection and master it with fun, interactive study modes. 
              <strong className="text-slate-200"> Olé Learning</strong> is the friendly companion that helps you organize your learning and track your progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start text-sm font-medium text-slate-400">
               <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> Start for free</div>
               <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-500" /> Learn at your own pace</div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="flex justify-center lg:justify-end animate-in fade-in duration-1000 delay-300">
            <div 
              className="flex flex-col items-center text-center p-8 pb-10 relative group overflow-hidden"
              style={{ 
                width: '420px',
                maxWidth: '100%',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(25, 35, 65, 0.5) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '28px', 
                border: '1.5px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 12px 48px rgba(59, 130, 246, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Premium shimmer on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>

              {/* LOGO */}
              <div className="mx-auto w-24 h-24 mb-6 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-2xl blur-xl" />
                <img src={logo} alt="Olé Learning" className="relative w-full h-full object-cover rounded-2xl shadow-lg border border-blue-400/30 z-10" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-2 z-10 relative">Welcome Back!</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed px-4 z-10 relative">
                Ready to learn some new words today? Sign in to continue.
              </p>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="w-full mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm z-10 relative">
                  {error}
                </div>
              )}

              {/* AUTH MODE TABS */}
              <div className="flex gap-2 mb-6 w-full bg-gradient-to-r from-slate-800/50 to-slate-900/30 p-1.5 rounded-lg border border-slate-700/40 z-10 relative">
                <button
                  onClick={() => { setAuthMode('google'); setError(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-300 ${
                    authMode === 'google' 
                      ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Google
                </button>
                <button
                  onClick={() => { setAuthMode('login'); setError(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-300 ${
                    authMode === 'login' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-lg shadow-blue-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Email
                </button>
              </div>

              {/* GOOGLE AUTH */}
              {authMode === 'google' && (
                <div className="w-full space-y-3 z-10 relative">
                  <button
                    onClick={signInWithGoogle}
                    disabled={loading}
                    className="relative w-full flex items-center justify-center gap-3 py-4 rounded-2xl shadow-lg transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] hover:shadow-amber-500/40 group bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 border border-amber-500/30 hover:border-amber-400/50 overflow-hidden"
                  >
                    {loading ? (
                      <span className="text-sm font-bold">Connecting...</span>
                    ) : (
                      <>
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="bg-white p-1.5 rounded-full relative z-10"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" /></div>
                        <span className="text-sm font-bold tracking-wide relative z-10">Continue with Google</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform relative z-10" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGuestSignIn}
                    disabled={loading}
                    className="relative w-full flex items-center justify-center gap-3 py-4 rounded-2xl shadow-lg transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] border border-cyan-500/30 hover:border-cyan-400/50 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 hover:from-cyan-900/50 hover:to-blue-900/40 group disabled:opacity-50 overflow-hidden"
                  >
                    {loading ? (
                      <span className="text-sm font-bold">Connecting...</span>
                    ) : (
                      <>
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Zap2 size={18} className="text-cyan-400 group-hover:scale-125 transition-transform relative z-10" />
                        <span className="text-sm font-bold tracking-wide relative z-10">Continue as Guest</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform relative z-10" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* EMAIL LOGIN */}
              {authMode === 'login' && (
                <form onSubmit={handleEmailSignIn} className="w-full space-y-4 z-10 relative">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3.5 bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-blue-500/20 hover:border-blue-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 disabled:opacity-50 shadow-sm shadow-blue-500/10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400/60" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3.5 bg-gradient-to-br from-slate-800/50 to-slate-900/30 border border-blue-500/20 hover:border-blue-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300 disabled:opacity-50 shadow-sm shadow-blue-500/10"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-6 bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/20 shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="flex-1 h-px bg-slate-700" />
                    <span>or</span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="w-full py-3 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-bold rounded-lg transition-all"
                  >
                    Create New Account
                  </button>

                  <Link to="/forgot-password" className="block text-center text-xs text-amber-400 hover:text-amber-300 font-medium mt-2">
                    Forgot your password?
                  </Link>
                </form>
              )}

              {/* EMAIL SIGNUP */}
              {authMode === 'signup' && (
                <form onSubmit={handleEmailSignUp} className="w-full space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-6 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full py-3 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-bold rounded-lg transition-all"
                  >
                    Already have an account?
                  </button>
                </form>
              )}

              <p className="text-xs text-slate-500 mt-6 text-center px-4">
                <span className="block mb-2">By continuing, you agree to our <Link to="/terms" className="underline hover:text-slate-300">Terms</Link> and <Link to="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.</span>
                <span className="text-slate-600">Guest mode is perfect for testing. Your progress won't be saved permanently.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-24 relative bg-slate-900/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
           <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple tools, big results.</h2>
              <p className="text-lg text-slate-400">Everything you need to grow your vocabulary and actually remember it.</p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                 icon={<BookOpen />}
                 title="Your Word Bank"
                 description="Create your own personal dictionary. Save words, organize them into folders, and track your mastery level for each one."
                 color="amber"
              />
              <FeatureCard 
                 icon={<Brain />}
                 title="Fun Study Modes"
                 description="Practice what you've saved. Flip through Flashcards, test yourself with Quizzes, or play the Speed Match game."
                 color="blue"
              />
              <FeatureCard 
                 icon={<Sparkles />}
                 title="Smart Assistants"
                 description="Need help? Use our tools to instantly summarize Spanish text or extract vocabulary lists to save time."
                 color="purple"
              />
           </div>
        </div>
      </section>

      {/* --- PRICING TEASER --- */}
      <section className="py-24 relative overflow-hidden">
         {/* Bottom Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[1000px] h-[600px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />
        
         <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl mb-8 shadow-2xl shadow-amber-500/30">
               <Crown size={32} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Free to start. Upgrade for more.</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
               Olé Learning is free to use every day. If you need more room to grow, you can upgrade to Premium anytime.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
               {/* Free Tier */}
               <div className="bg-slate-800/50 border border-white/5 p-8 rounded-3xl text-left">
                  <h3 className="text-2xl font-bold mb-2">Student</h3>
                  <p className="text-amber-400 font-bold mb-6">Free Forever</p>
                  <ul className="space-y-3 text-slate-300 mb-8">
                     <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-slate-500" /> 5 Words added daily</li>
                     <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-slate-500" /> 3 Assistant requests daily</li>
                     <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-slate-500" /> Daily study sessions</li>
                  </ul>
                  <button onClick={signInWithGoogle} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">
                     Start Learning
                  </button>
               </div>
               {/* Premium Tier */}
               <div className="bg-gradient-to-b from-amber-900/20 to-slate-900/50 border border-amber-500/30 p-8 rounded-3xl text-left relative overflow-hidden group">
                  <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors -z-10" />
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">Premium <Crown size={20} className="text-amber-400" /></h3>
                  <p className="text-white font-bold mb-6">£9.99 <span className="text-sm font-normal text-slate-400">/ month</span></p>
                  <ul className="space-y-3 text-white mb-8">
                     <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-400" /> <strong>Unlimited</strong> Words</li>
                     <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-400" /> <strong>Unlimited</strong> Assistant Usage</li>
                     <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-400" /> <strong>Unlimited</strong> Study</li>
                     <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-amber-400" /> No Ads</li>
                  </ul>
                  <button onClick={signInWithGoogle} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]">
                     Go Premium
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm relative z-10 bg-[#02040a]">
         <div className="flex items-center justify-center gap-3 mb-4 opacity-50 hover:opacity-100 transition-opacity">
            <img src={logo} alt="Logo" className="w-6 h-6 grayscale" />
            <span className="font-bold">Olé Learning</span>
         </div>
         <p>© {new Date().getFullYear()} Alejandro. All rights reserved.</p>
      </footer>

    </div>
  );
}

// --- HELPER COMPONENT FOR FEATURE GRID ---
function FeatureCard({ icon, title, description, color }) {
   const colors = {
      amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20 hover:border-amber-400/50',
      blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:border-blue-400/50',
      purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20 hover:border-purple-400/50',
   }
   return (
      <div className={`p-8 rounded-3xl border ${colors[color]} bg-[#0f172a]/50 backdrop-blur-sm transition-all duration-300 group hover:-translate-y-1`}>
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${colors[color].split(' ')[1]} ${colors[color].split(' ')[0]} shadow-lg`}>
            {React.cloneElement(icon, { size: 28 })}
         </div>
         <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
         <p className="text-slate-400 leading-relaxed">
            {description}
         </p>
      </div>
   )
}