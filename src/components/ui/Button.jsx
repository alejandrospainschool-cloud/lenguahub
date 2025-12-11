export default function Button({ children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      {...props}
      className={`px-4 py-2 rounded-xl shadow-md transition transform hover:scale-[1.02] bg-white/10 backdrop-blur border border-white/20 text-slate-100 ${className}`}
    >
      {children}
    </button>
  );
}
