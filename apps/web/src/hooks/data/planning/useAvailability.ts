// src/hooks/data/planning/useAvailability.ts
//
// Hook React Query pour vérifier la disponibilité des ressources en temps réel.
// ─────────────────────────────────────────────────────────────────────────────
// - Debounce 300ms sur les inputs pour éviter les appels en rafale
// - Désactivé automatiquement si start/end invalides
// - Résultat par ressource : { id, available }

"use client";

import { useQuery }               from "@tanstack/react-query";
import { useDebounce }            from "@/hooks/utils/use-debounce";
import { checkAvailabilityAction } from "@/services/planning/conflict/actions";
import type { CheckAvailabilityActionParams } from "@/services/planning/conflict/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAvailabilityParams {
    start?:             Date | null;
    end?:               Date | null;
    rooms?:             { id: string }[];
    teachers?:          { id: string }[];
    classes?:           { id: string }[];
    groups?:            { id: string }[];
    excludeScheduleId?: string;
    enabled?:           boolean;
}

export interface ResourceAvailability {
    id:        string;
    available: boolean;
}

export interface AvailabilityResult {
    rooms:    ResourceAvailability[];
    teachers: ResourceAvailability[];
    classes:  ResourceAvailability[];
    groups:   ResourceAvailability[];
}

// ─── Clé de cache React Query ─────────────────────────────────────────────────

export const availabilityKeys = {
    all:    ["availability"] as const,
    check:  (params: CheckAvailabilityActionParams) =>
                ["availability", "check", params] as const,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAvailability(params: UseAvailabilityParams) {
    const {
        start,
        end,
        rooms        = [],
        teachers     = [],
        classes      = [],
        groups       = [],
        excludeScheduleId,
        enabled: enabledOverride,
    } = params;

    const debouncedParams = useDebounce(
        { start, end, rooms, teachers, classes, groups, excludeScheduleId },
        300
    );

    const isInvalidDate =
        !!debouncedParams.start &&
        !!debouncedParams.end &&
        debouncedParams.start >= debouncedParams.end;

    const hasResources =
        debouncedParams.rooms.length    > 0 ||
        debouncedParams.teachers.length > 0 ||
        debouncedParams.classes.length  > 0 ||
        debouncedParams.groups.length   > 0;

    const isEnabled = enabledOverride ?? (!isInvalidDate && hasResources);

    const query = useQuery({
        queryKey: availabilityKeys.check({
            start:             debouncedParams.start!,
            end:               debouncedParams.end!,
            rooms:             debouncedParams.rooms,
            teachers:          debouncedParams.teachers,
            classes:           debouncedParams.classes,
            groups:            debouncedParams.groups,
            excludeScheduleId: debouncedParams.excludeScheduleId,
        }),

        queryFn: async () => {
            const res = await checkAvailabilityAction({
                start:             debouncedParams.start!,
                end:               debouncedParams.end!,
                rooms:             debouncedParams.rooms,
                teachers:          debouncedParams.teachers,
                classes:           debouncedParams.classes,
                groups:            debouncedParams.groups,
                excludeScheduleId: debouncedParams.excludeScheduleId,
            });

            if ('error' in res) throw new Error(res.error);
            return res.data as AvailabilityResult;
        },

        enabled:   isEnabled,
        staleTime: 30_000,
        retry:     false,
    });

    const availabilityMap = {
        rooms:    new Map(query.data?.rooms.map(    (r) => [r.id, r.available]) ?? []),
        teachers: new Map(query.data?.teachers.map( (t) => [t.id, t.available]) ?? []),
        classes:  new Map(query.data?.classes.map(  (c) => [c.id, c.available]) ?? []),
        groups:   new Map(query.data?.groups.map(   (g) => [g.id, g.available]) ?? []),
    };

    return {
        isInvalidDate,
        data:      query.data,
        isLoading: query.isLoading && isEnabled,
        isError:   query.isError,
        error:     query.error,
        isRoomAvailable:    (id: string) => availabilityMap.rooms.get(id)    ?? true,
        isTeacherAvailable: (id: string) => availabilityMap.teachers.get(id) ?? true,
        isClassAvailable:   (id: string) => availabilityMap.classes.get(id)  ?? true,
        isGroupAvailable:   (id: string) => availabilityMap.groups.get(id)   ?? true,
        hasConflict: query.data
            ? [...availabilityMap.rooms.values(),
               ...availabilityMap.teachers.values(),
               ...availabilityMap.classes.values(),
               ...availabilityMap.groups.values()].some((v) => !v)
            : false,
        isChecking: isEnabled && (query.isFetching || query.isLoading),
    };
}
