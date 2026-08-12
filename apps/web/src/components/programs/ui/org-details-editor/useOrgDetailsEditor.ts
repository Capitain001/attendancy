// src/components/programs/ui/org-details-editor/useOrgDetailsEditor.ts
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { OrgDetails } from "@/services/organization";
import { DetailsBlock, BlockTemplate, BlockField, FieldType, TemplateField } from "./types";
import { BUILT_IN_TEMPLATES } from "./templates";
import { genId, makeBlockFromTemplate, makeRecordFromTemplate, makeField, buildJSON } from "./utils";

// ─────────────────────────────────────────────────────────────────────────────
// hydrateBlocks : OrgDetails (DB) → DetailsBlock[] (editor state)
// ─────────────────────────────────────────────────────────────────────────────

function hydrateBlocks(details: OrgDetails): DetailsBlock[] {
  const blocks: DetailsBlock[] = [];

  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null) continue;

    const tpl = BUILT_IN_TEMPLATES.find((t) => t.key === key);

    // ── Array → bloc isList ────────────────────────────────────────────────
    if (Array.isArray(value)) {
      const records: BlockField[][] = (value as Record<string, unknown>[]).map((item) => {
        const itemFields: BlockField[] = [];

        for (const [fKey, fVal] of Object.entries(item)) {
          if (Array.isArray(fVal)) {
            itemFields.push(makeField(fKey, "multi", fVal as string[]));
          } else {
            itemFields.push(makeField(fKey, "text", [String(fVal ?? "")]));
          }
        }

        // Ensure every template field exists + sort by template order
        if (tpl) {
          const existingKeys = new Set(itemFields.map((f) => f.key));
          tpl.fields.forEach((tf) => {
            if (!existingKeys.has(tf.key)) {
              itemFields.push(makeField(tf.key, tf.type));
            }
          });
          itemFields.sort((a, b) => {
            const ai = tpl.fields.findIndex((f) => f.key === a.key);
            const bi = tpl.fields.findIndex((f) => f.key === b.key);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });
        }

        return itemFields;
      });

      blocks.push({
        id: genId(),
        key,
        label: tpl?.label ?? key,
        isList: true,
        records,
        fields: [],
      });

    // ── Object → bloc simple ───────────────────────────────────────────────
    } else if (typeof value === "object") {
      const fields: BlockField[] = [];

      for (const [fKey, fVal] of Object.entries(value as Record<string, unknown>)) {
        if (Array.isArray(fVal)) {
          fields.push(makeField(fKey, "multi", fVal as string[]));
        } else {
          fields.push(makeField(fKey, "text", [String(fVal ?? "")]));
        }
      }

      blocks.push({
        id: genId(),
        key,
        label: tpl?.label ?? key,
        isList: false,
        records: [],
        fields,
      });
    }
  }

  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useOrgDetailsEditor(
  onChange?: (json: Record<string, unknown>) => void,
  initialValue?: OrgDetails,
) {
  // Hydrate once from DB data, then keep local state
  const hydrated = useRef(false);

  const [blocks, setBlocks] = useState<DetailsBlock[]>(() =>
    initialValue ? hydrateBlocks(initialValue) : []
  );

  // Sync when data arrives from the async fetch (initialValue goes from undefined → OrgDetails)
  useEffect(() => {
    if (initialValue && !hydrated.current) {
      hydrated.current = true;
      setBlocks(hydrateBlocks(initialValue));
    }
  }, [initialValue]);

  const [showPicker,       setShowPicker]       = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [userTemplates,    setUserTemplates]    = useState<BlockTemplate[]>([]);
  const [saveModalBlockId, setSaveModalBlockId] = useState<string | null>(null);
  const [saveLabel,        setSaveLabel]        = useState("");
  const [saveKey,          setSaveKey]          = useState("");

  const allTemplates = [...BUILT_IN_TEMPLATES, ...userTemplates];

  // ── Updater ────────────────────────────────────────────────────────────────

  const update = useCallback(
    (fn: (prev: DetailsBlock[]) => DetailsBlock[]) => {
      setBlocks((prev) => {
        const next = fn(prev);
        onChange?.(buildJSON(next));
        return next;
      });
    },
    [onChange]
  );

  // ── Field helpers (pure) ───────────────────────────────────────────────────

  const patchField = (fields: BlockField[], fid: string, patch: Partial<BlockField>) =>
    fields.map((f) => (f.id === fid ? { ...f, ...patch } : f));

  const multiAdd = (fields: BlockField[], fid: string) =>
    fields.map((f) => (f.id === fid ? { ...f, values: [...f.values, ""] } : f));

  const multiRemove = (fields: BlockField[], fid: string, idx: number) =>
    fields.map((f) => (f.id === fid ? { ...f, values: f.values.filter((_, i) => i !== idx) } : f));

  const multiChange = (fields: BlockField[], fid: string, idx: number, val: string) =>
    fields.map((f) => (f.id === fid ? { ...f, values: f.values.map((v, i) => (i === idx ? val : v)) } : f));

  // ── Block ops ──────────────────────────────────────────────────────────────

  const addBlock = (tpl: BlockTemplate) =>
    update((prev) => [...prev, makeBlockFromTemplate(tpl)]);

  const removeBlock = (bid: string) =>
    update((prev) => prev.filter((b) => b.id !== bid));

  const updateBlockMeta = (bid: string, patch: Partial<Pick<DetailsBlock, "key" | "label">>) =>
    update((prev) => prev.map((b) => (b.id === bid ? { ...b, ...patch } : b)));

  // ── Record ops ─────────────────────────────────────────────────────────────

  const addRecord = (bid: string, tpl: BlockTemplate) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid ? { ...b, records: [...b.records, makeRecordFromTemplate(tpl.fields)] } : b
      )
    );

  const removeRecord = (bid: string, rIdx: number) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid ? { ...b, records: b.records.filter((_, i) => i !== rIdx) } : b
      )
    );

  // ── Object block field ops ─────────────────────────────────────────────────

  const objFieldChange = (bid: string, fid: string, patch: Partial<BlockField>) =>
    update((prev) => prev.map((b) => (b.id === bid ? { ...b, fields: patchField(b.fields, fid, patch) } : b)));

  const objMultiAdd = (bid: string, fid: string) =>
    update((prev) => prev.map((b) => (b.id === bid ? { ...b, fields: multiAdd(b.fields, fid) } : b)));

  const objMultiRemove = (bid: string, fid: string, idx: number) =>
    update((prev) => prev.map((b) => (b.id === bid ? { ...b, fields: multiRemove(b.fields, fid, idx) } : b)));

  const objMultiChange = (bid: string, fid: string, idx: number, val: string) =>
    update((prev) => prev.map((b) => (b.id === bid ? { ...b, fields: multiChange(b.fields, fid, idx, val) } : b)));

  const objAddField = (bid: string, type: FieldType = "text") =>
    update((prev) =>
      prev.map((b) => (b.id === bid ? { ...b, fields: [...b.fields, makeField("", type)] } : b))
    );

  const objRemoveField = (bid: string, fid: string) =>
    update((prev) =>
      prev.map((b) => (b.id === bid ? { ...b, fields: b.fields.filter((f) => f.id !== fid) } : b))
    );

  // ── List record field ops ──────────────────────────────────────────────────

  const recFieldChange = (bid: string, rIdx: number, fid: string, patch: Partial<BlockField>) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid
          ? { ...b, records: b.records.map((rec, i) => (i === rIdx ? patchField(rec, fid, patch) : rec)) }
          : b
      )
    );

  const recMultiAdd = (bid: string, rIdx: number, fid: string) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid
          ? { ...b, records: b.records.map((rec, i) => (i === rIdx ? multiAdd(rec, fid) : rec)) }
          : b
      )
    );

  const recMultiRemove = (bid: string, rIdx: number, fid: string, idx: number) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid
          ? { ...b, records: b.records.map((rec, i) => (i === rIdx ? multiRemove(rec, fid, idx) : rec)) }
          : b
      )
    );

  const recMultiChange = (bid: string, rIdx: number, fid: string, idx: number, val: string) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid
          ? { ...b, records: b.records.map((rec, i) => (i === rIdx ? multiChange(rec, fid, idx, val) : rec)) }
          : b
      )
    );

  const recAddField = (bid: string, rIdx: number) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid
          ? { ...b, records: b.records.map((rec, i) => (i === rIdx ? [...rec, makeField()] : rec)) }
          : b
      )
    );

  const recRemoveField = (bid: string, rIdx: number, fid: string) =>
    update((prev) =>
      prev.map((b) =>
        b.id === bid
          ? { ...b, records: b.records.map((rec, i) => (i === rIdx ? rec.filter((f) => f.id !== fid) : rec)) }
          : b
      )
    );

  // ── Save as template ───────────────────────────────────────────────────────

  const openSaveModal = (bid: string) => {
    const b = blocks.find((b) => b.id === bid)!;
    setSaveLabel(b.label + " (copie)");
    setSaveKey(b.key + "_custom");
    setSaveModalBlockId(bid);
  };

  const confirmSave = () => {
    const b = blocks.find((b) => b.id === saveModalBlockId)!;
    const tplFields: TemplateField[] =
      b.isList && b.records[0]
        ? b.records[0].map((f) => ({ key: f.key, type: f.type }))
        : b.fields.map((f) => ({ key: f.key, type: f.type }));

    setUserTemplates((prev) => [
      ...prev,
      {
        id: genId(),
        label: saveLabel || b.label,
        description: "Template personnalisé",
        icon: "⭐",
        key: saveKey || b.key,
        isList: b.isList,
        fields: tplFields,
      },
    ]);
    setSaveModalBlockId(null);
  };

  // ── Copy JSON ──────────────────────────────────────────────────────────────

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(buildJSON(blocks), null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // ── Template for a block ───────────────────────────────────────────────────

  const tplForBlock = (b: DetailsBlock): BlockTemplate =>
    allTemplates.find((t) => t.key === b.key) ??
    { id: "", label: b.label, description: "", icon: "✏️", key: b.key, isList: b.isList, fields: [] };

  return {
    blocks, allTemplates,
    showPicker, setShowPicker,
    copied,
    saveModalBlockId, setSaveModalBlockId,
    saveLabel, setSaveLabel,
    saveKey, setSaveKey,
    addBlock, removeBlock, updateBlockMeta,
    addRecord, removeRecord,
    objFieldChange, objMultiAdd, objMultiRemove, objMultiChange, objAddField, objRemoveField,
    recFieldChange, recMultiAdd, recMultiRemove, recMultiChange, recAddField, recRemoveField,
    openSaveModal, confirmSave,
    copyJSON, buildJSON: () => buildJSON(blocks),
    tplForBlock,
  };
}