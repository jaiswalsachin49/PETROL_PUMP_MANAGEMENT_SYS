export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
    );
}
