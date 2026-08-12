"use client";

export function ProgramLabel() {
    return (
        <div className="flex items-center gap-2 px-2 py-1 text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground border-b-2 bg-muted/20 min-w-max w-full">
            <div className="w-12 md:w-16 text-center">Nom</div>
            <div className="w-24 md:w-32">Code</div>
            <div className="w-48 md:w-80">Département</div>
            <div className="w-24 md:w-40 ">Description</div>
            <div className="w-full text-end">Actions</div>
        </div>
    );
}
