import type { FieldType } from "../../data/recordDefinitions";
import type { ParsedField } from "../../parser";

export function getFieldValidationError(field: ParsedField, value: string): string | null {
  if (value.length > field.length) {
    return `Maximum length is ${field.length}.`;
  }

  switch (field.type) {
    case "Numeric":
    case "Amount":
    case "Date":
    case "Time":
      if (!/^\d*$/.test(value)) {
        return "Only digits are allowed.";
      }
      if (value.length !== field.length) {
        return `Must contain exactly ${field.length} digits.`;
      }
      return null;
    case "Sign":
      if (!/^[+-]?$/.test(value)) {
        return "Use + or - only.";
      }
      if (value.length !== field.length) {
        return `Must contain exactly ${field.length} character.`;
      }
      return null;
    case "Character":
    case "Reserved":
      return null;
    default:
      return null;
  }
}

export function isDigitsOnlyType(fieldType: FieldType): boolean {
  return fieldType === "Numeric" || fieldType === "Amount" || fieldType === "Date" || fieldType === "Time";
}
