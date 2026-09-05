// src/components/programs/ui/org-details-editor/OrgDetailsEditor.tsx
"use client";

import { OrgDetailsEditorProps } from "./types";
import { FieldRow } from "./FieldRow";
import { RecordCard } from "./RecordCard";
import { TemplatePicker } from "./TemplatePicker";
import { useOrgDetailsEditor } from "./useOrgDetailsEditor";
import { useOrgDetails } from "@/hooks/data/organization/useOrgDetails";
import { OrgDetails } from "@/services/organization";


export default function OrgDetailsEditor({ onChange }: OrgDetailsEditorProps) {
  const { data, fetchStatus, fetchError, saveStatus, saveError, save } = useOrgDetails();

  const {
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
    copyJSON, buildJSON,
    tplForBlock,
  } = useOrgDetailsEditor(onChange, data?.details ?? undefined);

  const handleSave = () => save(buildJSON() as OrgDetails);

  // ── Loading / Error states ────────────────────────────────────────────────

  if (fetchStatus === "loading" || fetchStatus === "idle") {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <span className="animate-spin">⏳</span>
        Chargement des données…
      </div>
    );
  }

  if (fetchStatus === "error") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {fetchError ?? "Impossible de charger les données."}
      </div>
    );
  }

  return (
    <div className="w-full py-4">

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Champ{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-muted-foreground">
            details
          </code>
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Composez librement la structure JSON de votre organisation.
        </p>
      </div>

      {/* Block list */}
      <div className="flex flex-col gap-3">
        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-10 text-center">
            <span className="text-3xl">📂</span>
            <p className="mt-2 text-xs text-muted-foreground">
              Aucun bloc. Utilisez le bouton ci-dessous pour commencer.
            </p>
          </div>
        )}

        {blocks.map((block) => {
          const tpl = tplForBlock(block);
          return (
            <div key={block.id} className="overflow-hidden rounded-xl border border-border bg-muted/50">

              {/* Block header */}
              <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
                <span className="shrink-0 text-base leading-none">{tpl.icon}</span>

                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
                  value={block.label}
                  onChange={(e) => updateBlockMeta(block.id, { label: e.target.value })}
                  title="Nom du bloc"
                />

                <span className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1">
                  <span className="font-mono text-[10px] text-muted-foreground">clé :</span>
                  <input
                    className="w-24 bg-transparent font-mono text-[11px] text-muted-foreground outline-none"
                    value={block.key}
                    onChange={(e) => updateBlockMeta(block.id, { key: e.target.value })}
                    title="Clé JSON"
                  />
                </span>

                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="rounded p-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Sauvegarder comme template"
                    onClick={() => openSaveModal(block.id)}
                  >
                    💾
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Supprimer ce bloc"
                    onClick={() => removeBlock(block.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Block body */}
              <div className="flex flex-col gap-2.5 p-3">
                {block.isList ? (
                  <>
                    {block.records.map((rec, rIdx) => (
                      <RecordCard
                        key={rIdx}
                        record={rec}
                        index={rIdx}
                        tplFields={tpl.fields}
                        onFieldChange={(fid, patch) => recFieldChange(block.id, rIdx, fid, patch)}
                        onMultiAdd={(fid) => recMultiAdd(block.id, rIdx, fid)}
                        onMultiRemove={(fid, idx) => recMultiRemove(block.id, rIdx, fid, idx)}
                        onMultiChange={(fid, idx, v) => recMultiChange(block.id, rIdx, fid, idx, v)}
                        onAddField={() => recAddField(block.id, rIdx)}
                        onRemoveField={(fid) => recRemoveField(block.id, rIdx, fid)}
                        onRemoveRecord={() => removeRecord(block.id, rIdx)}
                      />
                    ))}
                    <button
                      type="button"
                      className="w-full rounded-lg border border-dashed border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-input hover:text-foreground"
                      onClick={() => addRecord(block.id, tpl)}
                    >
                      + Ajouter une entrée
                    </button>
                  </>
                ) : (
                  <>
                    {block.fields.map((f) => {
                      const tplF = tpl.fields.find((t) => t.key === f.key);
                      return (
                        <FieldRow
                          key={f.id}
                          field={f}
                          tplField={tplF}
                          isFixed={!!tplF}
                          onKeyChange={(v) => objFieldChange(block.id, f.id, { key: v })}
                          onValueChange={(v) => objFieldChange(block.id, f.id, { value: v })}
                          onMultiAdd={() => objMultiAdd(block.id, f.id)}
                          onMultiRemove={(idx) => objMultiRemove(block.id, f.id, idx)}
                          onMultiChange={(idx, v) => objMultiChange(block.id, f.id, idx, v)}
                          onRemoveField={() => objRemoveField(block.id, f.id)}
                        />
                      );
                    })}
                    <div className="mt-1 flex gap-2 border-t border-dashed border-border pt-2">
                      <button
                        type="button"
                        className="rounded border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-input hover:text-foreground"
                        onClick={() => objAddField(block.id, "text")}
                      >
                        + Champ texte
                      </button>
                      <button
                        type="button"
                        className="rounded border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-input hover:text-foreground"
                        onClick={() => objAddField(block.id, "multi")}
                      >
                        + Champ multi-valeurs
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add block button */}
      <button
        type="button"
        className="mt-3 w-full rounded-xl border-2 border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-input hover:text-foreground"
        onClick={() => setShowPicker(true)}
      >
        + Ajouter un bloc
      </button>

      {/* JSON Preview + Save */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Aperçu JSON
          </span>

          <div className="flex items-center gap-2">
            {/* Copy */}
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={copyJSON}
            >
              {copied ? "✓ Copié !" : "Copier JSON"}
            </button>

            {/* Save to DB */}
            <button
              type="button"
              disabled={saveStatus === "saving"}
              onClick={handleSave}
              className={[
                "rounded-md px-4 py-1 text-[11px] font-medium transition-colors",
                saveStatus === "saving"
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : saveStatus === "success"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : saveStatus === "error"
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              ].join(" ")}
            >
              {saveStatus === "saving"
                ? "Enregistrement…"
                : saveStatus === "success"
                ? "✓ Enregistré"
                : saveStatus === "error"
                ? "Réessayer"
                : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {saveStatus === "error" && saveError && (
          <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            {saveError}
          </p>
        )}

        <pre className="max-h-60 overflow-auto rounded-xl border border-border bg-muted/50 p-3 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all">
          {JSON.stringify(buildJSON(), null, 2)}
        </pre>
      </div>

      {/* Template picker modal */}
      {showPicker && (
        <TemplatePicker
          templates={allTemplates}
          onPick={addBlock}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Save as template modal */}
      {saveModalBlockId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSaveModalBlockId(null)}
        >
          <div
            className="w-[92%] max-w-sm overflow-hidden rounded-xl bg-popover shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-popover-foreground">
                Sauvegarder comme template
              </span>
              <button
                type="button"
                className="px-1 text-sm text-muted-foreground/40 hover:text-foreground"
                onClick={() => setSaveModalBlockId(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Nom du template
                </label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-input"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Clé JSON par défaut
                </label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm text-muted-foreground outline-none focus:border-input"
                  value={saveKey}
                  onChange={(e) => setSaveKey(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={confirmSave}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
