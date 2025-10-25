export const Card = ({ children, className = '' }) => (
    <div className={`bg-white border-[0.2px] border-slate-300 rounded-xl shadow ${className}`}>
        {children}
    </div>
);
