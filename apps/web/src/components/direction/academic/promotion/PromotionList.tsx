"use client";

import { useMemo, useState } from "react";

import { PromotionFilter, ProgramTrack } from "./PromotionFilter";
import { PromotionTable } from "./PromotionTable";
import { GetClassesDto } from "@/services/class";
import { Level } from "@/generated/prisma/browser";

// export type { PromotionRow };

interface PromotionListProps {
    data: GetClassesDto;
    isLoading: boolean;
    programTracks?: ProgramTrack[];
}

export function PromotionList({ data, isLoading, programTracks = [] }: PromotionListProps) {
    const [query, setQuery] = useState("");
    const [trackId, setTrackId] = useState("");
    const [level, setLevel] = useState("");

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();

        return data.filter((cls) => {
            const matchesQuery = !q || cls.name.toLowerCase().includes(q);
            const matchesTrack = !trackId || cls.programTrack.id === trackId;
            const matchesLevel = !level || cls.level === level;
            return matchesQuery && matchesTrack && matchesLevel;
        });
    }, [data, query, trackId, level]);

    return (
        <div className="flex flex-col gap-3">
            <PromotionFilter
                query={query}
                setQuery={setQuery}
                trackId={trackId}
                setTrackId={setTrackId}
                level={level}
                setLevel={setLevel}
                programTracks={programTracks}
            />
            <PromotionTable data={rows} isLoading={isLoading} />
        </div>
    );
}
