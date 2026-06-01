export interface RecordFileTemplate {
  id: string;
  name: string;
  fileText: string;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "tree-chooser:record-file-templates";

function readAll(): RecordFileTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isRecordFileTemplate);
  } catch {
    return [];
  }
}

function writeAll(templates: RecordFileTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function isRecordFileTemplate(value: unknown): value is RecordFileTemplate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const template = value as RecordFileTemplate;
  return (
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.fileText === "string" &&
    typeof template.lineCount === "number" &&
    typeof template.createdAt === "string" &&
    typeof template.updatedAt === "string"
  );
}

export function listRecordFileTemplates(): RecordFileTemplate[] {
  return readAll().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function saveRecordFileTemplate(name: string, fileText: string, lineCount: number): RecordFileTemplate {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Template name is required.");
  }

  const now = new Date().toISOString();
  const templates = readAll();
  const existingIndex = templates.findIndex((template) => template.name.toLowerCase() === trimmedName.toLowerCase());

  if (existingIndex >= 0) {
    const updated: RecordFileTemplate = {
      ...templates[existingIndex],
      name: trimmedName,
      fileText,
      lineCount,
      updatedAt: now,
    };
    templates[existingIndex] = updated;
    writeAll(templates);
    return updated;
  }

  const created: RecordFileTemplate = {
    id: crypto.randomUUID(),
    name: trimmedName,
    fileText,
    lineCount,
    createdAt: now,
    updatedAt: now,
  };
  templates.push(created);
  writeAll(templates);
  return created;
}

export function deleteRecordFileTemplate(id: string): void {
  const templates = readAll().filter((template) => template.id !== id);
  writeAll(templates);
}

export function getRecordFileTemplate(id: string): RecordFileTemplate | undefined {
  return readAll().find((template) => template.id === id);
}
