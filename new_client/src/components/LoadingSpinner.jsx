export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-screen">
            <video src="/loader.mov" autoPlay loop muted className="w-64 h-64" />
        </div>
    );
}
