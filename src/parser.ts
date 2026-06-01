import {
  recordDefinitions,
  type FieldDefinition,
  type RecordDefinition,
} from "./data/recordDefinitions";

export interface ParsedField extends FieldDefinition {
  end: number;
  rawValue: string;
  displayValue: string;
  isBlank: boolean;
}

export interface ParsedLine {
  id: string;
  lineNumber: number;
  raw: string;
  recordType: string;
  recordLength: string;
  definition?: RecordDefinition;
  fields: ParsedField[];
  warnings: string[];
}

export function parseRecordFileText(text: string): ParsedLine[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line, index) => parseLine(line, index + 1));
}

export function parseLine(raw: string, lineNumber: number): ParsedLine {
  const recordType = sliceFixed(raw, 10, 12);
  const recordLength = sliceFixed(raw, 13, 15);
  const definition = recordDefinitions[recordType];
  const warnings: string[] = [];

  if (!definition) {
    warnings.push(
      `No layout is configured for record type ${recordType || "(blank)"}. Add it to recordDefinitions.ts to inspect its fields.`,
    );
  }

  const parsedRecordLength = Number(recordLength);
  if (Number.isFinite(parsedRecordLength) && parsedRecordLength > 0 && raw.length !== parsedRecordLength) {
    warnings.push(`This line is ${raw.length} characters, but the record length field says ${parsedRecordLength}.`);
  }

  const fields = (definition?.fields ?? fallbackFields(raw.length)).map((field) => parseField(raw, field));

  return {
    id: `${lineNumber}-${recordType}-${raw.slice(0, 9)}`,
    lineNumber,
    raw,
    recordType,
    recordLength,
    definition,
    fields,
    warnings,
  };
}

export function getRecordTypeCounts(lines: ParsedLine[]): Array<{ recordType: string; count: number; label: string }> {
  const counts = new Map<string, number>();

  for (const line of lines) {
    counts.set(line.recordType, (counts.get(line.recordType) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([recordType, count]) => ({
      recordType,
      count,
      label: recordDefinitions[recordType]?.name ?? "Unknown record type",
    }));
}

function fallbackFields(lineLength: number): FieldDefinition[] {
  const remainderStart = 16;
  const remainderLength = Math.max(lineLength - 15, 0);

  return [
    {
      name: "Record Sequence Number",
      start: 1,
      length: 9,
      type: "Numeric",
      description: "Sequential number assigned to every record in the file.",
    },
    {
      name: "Record Type Identifier",
      start: 10,
      length: 3,
      type: "Character",
      description: "Record type read from positions 10-12.",
    },
    {
      name: "Record Length",
      start: 13,
      length: 3,
      type: "Numeric",
      description: "Declared fixed record length.",
    },
    {
      name: "Unmapped record payload",
      start: remainderStart,
      length: remainderLength,
      type: "Character",
      description: "The rest of the fixed-width row. No detailed layout is configured for this record type yet.",
    },
  ];
}

function parseField(raw: string, field: FieldDefinition): ParsedField {
  const rawValue = sliceFixed(raw, field.start, field.start + field.length - 1);
  const normalized = rawValue.trim();

  return {
    ...field,
    end: field.start + field.length - 1,
    rawValue,
    displayValue: normalized.length > 0 ? normalized : "(blank)",
    isBlank: normalized.length === 0,
  };
}

function sliceFixed(raw: string, start: number, end: number): string {
  if (start < 1) {
    throw new Error(`Fixed-width fields are 1-based. Received start ${start}.`);
  }

  const exclusiveEnd = typeof end === "number" ? end : raw.length;
  return raw.slice(start - 1, exclusiveEnd);
}
