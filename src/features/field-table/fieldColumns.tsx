import type { ReactNode } from "react";
import { InfoTooltip } from "../../components/InfoTooltip";
import type { ParsedField } from "../../parser";

export type FieldColumnId = "field" | "position" | "type" | "value" | "info";

export interface FieldColumn {
  id: FieldColumnId;
  label: string;
  defaultWidth: number;
  minWidth: number;
  render: (field: ParsedField) => ReactNode;
}

export const fieldColumns: FieldColumn[] = [
  {
    id: "field",
    label: "Field",
    defaultWidth: 260,
    minWidth: 180,
    render: (field) => <strong>{field.name}</strong>,
  },
  {
    id: "position",
    label: "Position",
    defaultWidth: 130,
    minWidth: 100,
    render: (field) => `${field.start}-${field.end}`,
  },
  {
    id: "type",
    label: "Type",
    defaultWidth: 140,
    minWidth: 100,
    render: (field) => field.type,
  },
  {
    id: "value",
    label: "Value",
    defaultWidth: 300,
    minWidth: 160,
    render: (field) => (
      <code className={field.isBlank ? "blank-value" : undefined}>{field.displayValue || "(blank)"}</code>
    ),
  },
  {
    id: "info",
    label: "Info",
    defaultWidth: 90,
    minWidth: 70,
    render: (field) => <InfoTooltip label={`${field.name} information`} text={field.description} />,
  },
];

export const defaultColumnOrder = fieldColumns.map((column) => column.id);

export const defaultColumnWidths = Object.fromEntries(
  fieldColumns.map((column) => [column.id, column.defaultWidth]),
) as Record<FieldColumnId, number>;
