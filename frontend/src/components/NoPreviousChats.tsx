const NoPreviousChats = () => {
    return (
        <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background">
            <div
                className="w-20 h-20 mb-6 bg-[hsl(var(--secondary))] border-[3px] border-foreground flex items-center justify-center transform rotate-3"
                style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
            >
                <span className="text-3xl">📭</span>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tight mb-2">NO MESSAGES YET</h3>
            <p className="text-muted-foreground font-medium uppercase text-sm tracking-wide text-center max-w-xs">
                BE THE FIRST TO BREAK THE SILENCE. SAY SOMETHING!
            </p>
        </div>
    );
}

export default NoPreviousChats;