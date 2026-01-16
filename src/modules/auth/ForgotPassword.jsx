import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../lib/firebase';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import logo from '../../logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 font-sans selection:bg-amber-500/30 overflow-x-hidden">
      {/* --- NAVBAR --- */}
      <nav className="absolute top-0 left-0 right-0 z-50 py-6 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Olé Learning" className="w-10 h-10 rounded-xl shadow-lg shadow-amber-500/20" />
          <span className="font-bold text-xl tracking-tight hidden md:block">Olé Learning</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Back to Login
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          <div 
            className="flex flex-col items-center p-8 shadow-2xl"
            style={{ 
              backgroundColor: 'rgba(2, 6, 23, 0.8)', 
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '36px', 
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            }}
          >
            <div className="absolute inset-0 rounded-[36px] p-[1px] bg-gradient-to-b from-white/20 to-transparent -z-10 pointer-events-none" />

            {!submitted ? (
              <>
                {/* ICON */}
                <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-amber-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 text-center">Reset Your Password</h2>
                <p className="text-slate-400 text-sm mb-6 text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {/* ERROR MESSAGE */}
                {error && (
                  <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-6 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* SUCCESS STATE */}
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 text-center">Check Your Email</h2>
                <p className="text-slate-400 text-sm mb-6 text-center leading-relaxed">
                  We've sent a password reset link to <strong className="text-slate-200">{email}</strong>. Check your inbox and follow the instructions to reset your password.
                </p>
                
                <p className="text-xs text-slate-500 text-center mb-6">
                  If you don't see the email, check your spam folder or try again.
                </p>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Back to Login
                </button>
              </>
            )}

            {!submitted && (
              <p className="text-xs text-slate-500 mt-6 text-center">
                Remember your password? <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">Back to login</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
