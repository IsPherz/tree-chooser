import type { ParsedLine } from "../parser";

export function UnknownRecord({ line }: { line: ParsedLine }) {
  return (
    <div className="unknown-record">
      <h3>No layout is configured for record type {line.recordType || "(missing)"}</h3>
      <p>
        The app reads the record type from positions 10-12. Add a definition in
        <code> src/data/recordDefinitions.ts </code>
        to support more record types from your layout specification.
      </p>
    </div>
  );
}
