import { BlockField, FieldType, TemplateField, DetailsBlock, BlockTemplate } from "./types";

let _n = 0;
export const genId = () => `id_${++_n}_${Math.random().toString(36).slice(2, 6)}`;

export function makeField(key = "", type: FieldType = "text", values?: string[]): BlockField {
  return {
    id: genId(),
    key,
    type,
    value: values && type === "text" ? (values[0] ?? "") : "",
    values: type === "multi" ? (values ?? [""]) : [],
  };
}

export function makeRecordFromTemplate(tplFields: TemplateField[]): BlockField[] {
  return tplFields.map((f) => makeField(f.key, f.type));
}

export function makeBlockFromTemplate(tpl: BlockTemplate): DetailsBlock {
  return {
    id: genId(),
    key: tpl.key,
    label: tpl.label,
    isList: tpl.isList,
    records: tpl.isList ? [makeRecordFromTemplate(tpl.fields)] : [],
    fields: tpl.isList ? [] : tpl.fields.map((f) => makeField(f.key, f.type)),
  };
}

export function serializeBlock(block: DetailsBlock): unknown {
  const serializeFields = (fields: BlockField[]): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (!f.key.trim()) return;
      obj[f.key] = f.type === "multi" ? f.values.filter((v) => v.trim()) : f.value;
    });
    return obj;
  };
  return block.isList ? block.records.map(serializeFields) : serializeFields(block.fields);
}

export function buildJSON(blocks: DetailsBlock[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  blocks.forEach((b) => { if (b.key.trim()) out[b.key] = serializeBlock(b); });
  return out;
}
