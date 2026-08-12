import { BackgroundPattern } from "@/components/design/BackgroundPattern";
import { ProgramTrackDto } from "@/services/program-track/types";


export function ProgramTrackBanner({ programTrack }: { programTrack?: ProgramTrackDto }) {
    return (
        <div className="h-42 w-full overflow-hidden  border relative rounded-2xl bg-card">
            <BackgroundPattern className="opacity-30" />
            <div className="flex flex-col isolate  justify-between h-full border p-4 md:p-6">
                <h1 className="text-xl md:text-2xl font-bold tracking-wide">
                    <span className="text-foreground/40">  Filière :  </span>
                    <span className="bg-muted px-2 rounded text-foreground"> {programTrack?.name} </span>
                </h1>

                <div className="space-y-3">
                    <p className="md:max-w-2xl text-xs  text-muted-foreground md:text-base">
                        {programTrack?.description}
                    </p>

                    <span className="inline-block rounded-md border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                        {programTrack?.department?.name}
                    </span>
                </div>
            </div>
        </div>
    )
}