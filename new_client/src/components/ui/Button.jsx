export const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', ...props }) => {
    const baseStyles = 'rounded-lg font-medium transition-colors';
    const variants = {
        primary: 'bg-violet-600 text-white hover:bg-violet-700',
        outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
        ghost: 'text-slate-700 hover:bg-slate-100'
    };
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
