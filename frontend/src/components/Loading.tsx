import { FC } from "react";

const Loading: FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-background gap-6">
            {/* Neo-Brutalist Loading Animation */}
            <div className="relative">
                <div
                    className="w-16 h-16 border-[4px] border-foreground bg-[hsl(var(--secondary))]"
                    style={{
                        animation: 'brutal-pulse 0.8s ease-in-out infinite',
                        boxShadow: '4px 4px 0 hsl(var(--foreground))'
                    }}
                />
                <div
                    className="absolute top-2 left-2 w-16 h-16 border-[4px] border-foreground bg-background"
                    style={{
                        animation: 'brutal-pulse 0.8s ease-in-out infinite 0.4s',
                    }}
                />
            </div>

            <p className="text-lg font-bold uppercase tracking-wide animate-pulse">
                LOADING...
            </p>

            <style>{`
                @keyframes brutal-pulse {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.1) rotate(3deg); }
                }
            `}</style>
        </div>
    )
}

export default Loading;