export const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow ${className}`}>
        {children}
    </div>
);
