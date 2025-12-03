import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <DotLottieReact
        src="/loader1.lottie"
        loop
        autoplay
        className="w-48"
      />
    </div>
  );
}
