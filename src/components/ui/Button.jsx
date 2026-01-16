export default function Button({ children, onClick, className = '', variant = 'default', size = 'md', ...props }) {
  const baseStyles = `
    relative font-semibold transition-all duration-300 ease-out
    focus-visible:outline-2 focus-visible:outline-offset-2
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    backdrop-blur-md border rounded-xl
    flex items-center justify-center whitespace-nowrap gap-2
    overflow-hidden group
  `;

  const variants = {
    default: `
      bg-gradient-to-r from-blue-600/25 to-cyan-500/15 border-blue-400/40 hover:border-cyan-400/60
      text-blue-300 hover:text-cyan-200
      hover:from-blue-600/35 hover:to-cyan-500/25
      shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25
      hover:shadow-2xl
    `,
    secondary: `
      bg-gradient-to-r from-white/12 to-white/6 border-white/25 hover:border-white/40
      text-slate-100 hover:text-white
      hover:from-white/18 hover:to-white/12 shadow-lg shadow-white/5 hover:shadow-white/15
    `,
    ghost: `
      bg-transparent border-white/15 hover:border-white/30
      text-slate-300 hover:text-white
      hover:bg-white/8 shadow-none hover:shadow-lg hover:shadow-white/10
    `,
    destructive: `
      bg-gradient-to-r from-red-600/25 to-pink-500/15 border-red-400/40 hover:border-pink-400/60
      text-red-300 hover:text-pink-200
      hover:from-red-600/35 hover:to-pink-500/25 shadow-lg shadow-red-500/10 hover:shadow-red-500/25
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
    xl: 'px-9 py-4.5 text-xl',
  };

  return (
    <button
      onClick={onClick}
      {...props}
      className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <span className="absolute inset-0 -z-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></span>
    </button>
  );
}
