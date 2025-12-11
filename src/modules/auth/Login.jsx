import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, provider } from '../../lib/firebase';
import { Brain, Globe, Timer } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log("Attempting Google Sign-In...");
      
      // Force account selection to ensure we get a fresh token
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      
      // Get the Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      console.log("Sign-In Result:", result);
      console.log("Token received:", token ? "YES" : "NO");

      if (token) {
        // Save the token to session storage
        sessionStorage.setItem("google_access_token", token);
        console.log("Token saved to storage. Reloading...");
        
        // FORCE RELOAD: This guarantees App.jsx picks up the new token immediately
        window.location.reload(); 
      } else {
        console.error("ERROR: Login succeeded but NO TOKEN returned.");
        alert("Login successful, but Google didn't return a Calendar permission token. Please try again and ensure you check all permission boxes.");
        setLoading(false);
      }

    } catch (err) {
      console.error("Login Failed:", err);
      setLoading(false);
      alert("Login Error: " + err.message);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans"
      style={{ backgroundColor: '#02040a', fontFamily: 'Inter, sans-serif' }}
    >
      
      {/* GLOW EFFECT */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{ 
          width: '500px', 
          height: '500px', 
          backgroundColor: 'rgba(37, 99, 235, 0.2)', 
          filter: 'blur(120px)' 
        }} 
      />

      {/* CONTAINER */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        
        {/* INFO CARD */}
        <div 
          className="flex flex-col items-center text-center p-8 pb-10 shadow-2xl"
          style={{ 
            width: '350px',
            backgroundColor: 'rgba(2, 6, 23, 0.6)', 
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '36px', 
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
          }}
        >
          <h1 className="text-3xl font-bold text-white tracking-tight mb-4 mt-2">
            LenguaHub
          </h1>
          
          <p className="text-slate-400 text-sm mb-8 opacity-90 leading-6 font-medium">
            An app built to help your learning,
            <br />
            by Alejandro
          </p>

          <div className="flex justify-center gap-5 w-full">
            <IconBox icon={<Brain size={26} />} />
            <IconBox icon={<Globe size={26} />} />
            <IconBox icon={<Timer size={26} />} />
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="relative flex items-center justify-center gap-3 py-4 rounded-full shadow-2xl transition-transform duration-300 ease-out hover:scale-105 active:scale-95 hover:shadow-indigo-500/20"
          style={{ 
            width: '350px', 
            backgroundColor: '#1e2a45', 
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)' 
          }}
        >
          {loading ? (
            <span className="text-sm font-medium">Connecting...</span>
          ) : (
            <>
              <div 
                className="bg-white rounded-full flex items-center justify-center"
                style={{ width: '28px', height: '28px' }}
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="G" 
                  style={{ width: '18px', height: '18px', display: 'block' }} 
                />
              </div>
              <span className="text-sm font-bold tracking-wide">Continue with Google</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}

// Icon Helper Component
function IconBox({ icon }) {
  return (
    <div 
      className="flex items-center justify-center rounded-2xl border transition-transform duration-500 hover:rotate-6 hover:scale-110"
      style={{ 
        width: '60px', 
        height: '60px', 
        backgroundColor: 'rgba(15, 23, 42, 0.6)', 
        borderColor: 'rgba(96, 165, 250, 0.2)', 
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' 
      }}
    >
      {React.cloneElement(icon, { 
        size: 26,
        color: '#60a5fa', 
        style: { filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))' }
      })}
    </div>
  );
}