import type { ParsedField } from "../../parser";
import { isDigitsOnlyType } from "./fieldValidation";

export function buildRawLineFromInputs(fields: ParsedField[], fieldInputs: Record<number, string>): string {
  let nextLine = "";

  for (const field of fields) {
    const rawInput = fieldInputs[field.start] ?? "";
    let nextFieldRaw = rawInput.slice(0, field.length);

    if (isDigitsOnlyType(field.type)) {
      nextFieldRaw = nextFieldRaw.padStart(field.length, "0");
    } else if (field.type === "Sign") {
      nextFieldRaw = nextFieldRaw.padEnd(field.length, " ");
    } else {
      nextFieldRaw = nextFieldRaw.padEnd(field.length, " ");
    }

    nextLine += nextFieldRaw;
  }

  return nextLine;
}
