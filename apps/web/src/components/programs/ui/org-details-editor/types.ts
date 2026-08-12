export type FieldType = "text" | "multi";

export interface BlockField {
  id: string;
  key: string;
  type: FieldType;
  value: string;
  values: string[];
}

export interface DetailsBlock {
  id: string;
  key: string;
  label: string;
  isList: boolean;
  records: BlockField[][];
  fields: BlockField[];
}

export interface TemplateField {
  key: string;
  type: FieldType;
  placeholder?: string;
}

export interface BlockTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  key: string;
  isList: boolean;
  fields: TemplateField[];
}

export interface OrgDetailsEditorProps {
  initialValue?: Record<string, unknown>;
  onChange?: (value: Record<string, unknown>) => void;
}
