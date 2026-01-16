export default function Button({ children, onClick, className = '', variant = 'default', size = 'md', ...props }) {
  const baseStyles = `
    relative font-medium transition-all duration-300 ease-out
    focus-visible:outline-2 focus-visible:outline-offset-2
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    backdrop-blur-md border rounded-full
    flex items-center justify-center whitespace-nowrap
  `;

  const variants = {
    default: `
      bg-gradient-to-r from-blue-500/20 to-cyan-500/20
      border-blue-400/30 hover:border-blue-400/50
      text-blue-100 hover:text-white
      hover:from-blue-500/30 hover:to-cyan-500/30
      shadow-glass hover:shadow-glass-lg
      hover:backdrop-blur-xl
    `,
    secondary: `
      bg-white/8 border-white/15
      text-slate-100 hover:text-white
      hover:bg-white/12 hover:border-white/25
      shadow-glass hover:shadow-glass-lg
    `,
    ghost: `
      bg-transparent border-white/10
      text-slate-300 hover:text-white
      hover:bg-white/5 hover:border-white/20
    `,
    destructive: `
      bg-gradient-to-r from-red-500/20 to-rose-500/20
      border-red-400/30 hover:border-red-400/50
      text-red-100 hover:text-white
      hover:from-red-500/30 hover:to-rose-500/30
      shadow-glass
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  return (
    <button
      onClick={onClick}
      {...props}
      className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </button>
  );
}
