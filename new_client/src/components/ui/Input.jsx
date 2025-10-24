export const Input = ({ type = 'text', placeholder, value, onChange, className = '', ...props }) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${className}`}
        {...props}
    />
);
