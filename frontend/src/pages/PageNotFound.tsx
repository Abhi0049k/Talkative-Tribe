import { FC, useEffect } from "react"
import { Link } from "react-router-dom"

const PageNotFound: FC = () => {
    useEffect(() => {
        document.title = "404 PAGE NOT FOUND | TALKATIVE TRIBE"
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            {/* Decorative elements */}
            <div className="fixed top-20 left-20 w-16 h-16 bg-[hsl(var(--secondary))] border-[3px] border-foreground transform rotate-12 hidden md:block" />
            <div className="fixed bottom-32 right-32 w-12 h-12 bg-foreground hidden md:block" />

            <div className="text-center">
                {/* 404 Number */}
                <div className="relative inline-block mb-8">
                    <h1
                        className="text-[120px] md:text-[180px] font-bold leading-none tracking-tighter"
                        style={{ textShadow: '8px 8px 0 hsl(var(--secondary))' }}
                    >
                        404
                    </h1>
                </div>

                {/* Error Message */}
                <div className="bg-[hsl(var(--secondary))] text-black px-6 py-3 inline-block border-[3px] border-foreground mb-8" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
                    <p className="text-xl md:text-2xl font-bold uppercase tracking-wide">
                        PAGE NOT FOUND
                    </p>
                </div>

                {/* Description */}
                <p className="text-lg font-medium uppercase tracking-wide text-muted-foreground max-w-md mx-auto mb-8">
                    OOPS! THE PAGE YOU'RE LOOKING FOR DOESN'T EXIST OR HAS BEEN MOVED.
                </p>

                {/* Back Home Button */}
                <Link
                    to="/"
                    className="inline-block bg-foreground text-background px-8 py-4 font-bold uppercase tracking-wide text-lg border-[3px] border-foreground hover:bg-[hsl(var(--secondary))] hover:text-black transition-colors"
                    style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                >
                    ← GO BACK HOME
                </Link>
            </div>
        </div>
    )
}

export default PageNotFound;