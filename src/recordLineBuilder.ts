import type { FieldDefinition } from "./data/recordDefinitions";
import { recordDefinitions } from "./data/recordDefinitions";
import { isDigitsOnlyType } from "./features/field-table/fieldValidation";

const DEFAULT_RECORD_LENGTH = "200";

function defaultFieldValue(field: FieldDefinition, recordCode: string, sequenceNumber: number): string {
  if (field.name === "Record Sequence Number") {
    return sequenceNumber.toString().padStart(field.length, "0").slice(-field.length);
  }

  if (field.name === "Record Type Identifier") {
    return recordCode.padEnd(field.length, " ").slice(0, field.length);
  }

  if (field.name === "Record Length") {
    return DEFAULT_RECORD_LENGTH.padStart(field.length, "0").slice(-field.length);
  }

  if (isDigitsOnlyType(field.type)) {
    return "0".repeat(field.length);
  }

  if (field.type === "Sign") {
    return "+".padEnd(field.length, " ");
  }

  return " ".repeat(field.length);
}

export function buildEmptyRecordLine(recordCode: string, sequenceNumber: number): string {
  const definition = recordDefinitions[recordCode];
  if (!definition) {
    throw new Error(`No layout is configured for record type ${recordCode}.`);
  }

  return definition.fields.map((field) => defaultFieldValue(field, recordCode, sequenceNumber)).join("");
}

export function getNextRecordSequenceNumber(lines: string[]): number {
  let maxSequence = 0;

  for (const line of lines) {
    const sequence = Number(line.slice(0, 9));
    if (Number.isFinite(sequence)) {
      maxSequence = Math.max(maxSequence, sequence);
    }
  }

  return maxSequence + 1;
}
