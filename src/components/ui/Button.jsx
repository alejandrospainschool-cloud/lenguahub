export default function Button({ children, onClick, className = '', variant = 'default', size = 'md', ...props }) {
  const baseStyles = `
    relative font-medium transition-all duration-200 ease-out
    focus-visible:outline-2 focus-visible:outline-offset-2
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    backdrop-blur-sm border rounded-lg
    flex items-center justify-center whitespace-nowrap
  `;

  const variants = {
    default: `
      bg-blue-600/20 border-blue-400/30 hover:border-blue-400/50
      text-blue-400 hover:text-blue-300
      hover:bg-blue-600/30
    `,
    secondary: `
      bg-white/10 border-white/20
      text-slate-100 hover:text-white
      hover:bg-white/15 hover:border-white/30
    `,
    ghost: `
      bg-transparent border-white/10
      text-slate-300 hover:text-white
      hover:bg-white/5 hover:border-white/20
    `,
    destructive: `
      bg-red-500/20 border-red-400/30 hover:border-red-400/50
      text-red-400 hover:text-red-300
      hover:bg-red-500/30
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
