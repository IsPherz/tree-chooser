import type { KeyboardEvent } from "react";
import type { ParsedField, ParsedLine } from "../../parser";

export function createInitialFieldInputs(line: ParsedLine): Record<number, string> {
  const initialInputs: Record<number, string> = {};
  for (const field of line.fields) {
    initialInputs[field.start] = field.rawValue;
  }
  return initialInputs;
}

export function isTextInsertionKey(event: KeyboardEvent<HTMLInputElement>): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  return event.key.length === 1;
}
