"use client";

import { useState, useCallback, useEffect } from "react";
import type { OrgDetails } from "@/services/organization";
import {
  getOrgDetailsAction,
  setOrgDetailsAction,
} from "@/services/organization";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FetchStatus = "idle" | "loading" | "ready" | "error";
export type SaveStatus  = "idle" | "saving"  | "success" | "error";

export type OrgWithDetails = Record<string, unknown> & {
  details: OrgDetails;
};

export interface UseOrgDetailsReturn {
  // Fetch
  data:        OrgWithDetails | null;
  fetchStatus: FetchStatus;
  fetchError:  string | null;
  refetch:     () => Promise<void>;

  // Save
  saveStatus: SaveStatus;
  saveError:  string | null;
  save:       (details: OrgDetails) => Promise<void>;
  resetSave:  () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useOrgDetails(): UseOrgDetailsReturn {
  // ── Fetch state ──────────────────────────────────────────────────────────────

  const [data,        setData]        = useState<OrgWithDetails | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  // ── Save state ───────────────────────────────────────────────────────────────

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError,  setSaveError]  = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetch = useCallback(async () => {
    setFetchStatus("loading");
    setFetchError(null);

    const result = await getOrgDetailsAction();

    if ("error" in result) {
      setFetchStatus("error");
      setFetchError(result.error ?? "Impossible de charger les données");
    } else {
      setData(result.data ?? null);
      setFetchStatus("ready");
    }
  }, []);

  // Chargement automatique au montage
  useEffect(() => {
    fetch();
  }, [fetch]);

  // ── Save ─────────────────────────────────────────────────────────────────────

  const save = useCallback(async (details: OrgDetails) => {
    setSaveStatus("saving");
    setSaveError(null);


    const {data ,error} = await setOrgDetailsAction(details);


    if (error) {
        setSaveStatus("error");
        setSaveError(error ?? "Une erreur est survenue");
    } else {
      // Mise à jour locale optimiste — évite un refetch inutile
      setData(data ?? null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, []);

  const resetSave = useCallback(() => {
    setSaveStatus("idle");
    setSaveError(null);
  }, []);

  // ── Return ────────────────────────────────────────────────────────────────────

  return {
    data,
    fetchStatus,
    fetchError,
    refetch: fetch,
    saveStatus,
    saveError,
    save,
    resetSave,
  };
}