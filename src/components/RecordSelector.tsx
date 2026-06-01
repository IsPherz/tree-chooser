import type { ParsedLine } from "../parser";

function formatRecordOption(line: ParsedLine) {
  const recordName = line.definition?.name ?? "Unsupported record type";
  return `Line ${line.lineNumber} - ${line.recordType || "---"} - ${recordName}`;
}

export function RecordSelector({
  lines,
  selectedIndex,
  onSelect,
}: {
  lines: ParsedLine[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const selectedLine = lines[selectedIndex] ?? lines[0];

  return (
    <>
      <label className="record-select-label" htmlFor="record-line-select">
        Record line
      </label>
      <select
        id="record-line-select"
        className="record-select"
        value={selectedIndex}
        onChange={(event) => onSelect(Number(event.target.value))}
      >
        {lines.map((line, index) => (
          <option key={`${line.lineNumber}-${line.raw}`} value={index}>
            {formatRecordOption(line)}
          </option>
        ))}
      </select>

      <div className="selected-record-card">
        <div className="selected-record-top">
          <strong>Line {selectedLine.lineNumber}</strong>
          <span className="record-code">{selectedLine.recordType || "---"}</span>
        </div>
        <div className="record-name-row">
          <span className="record-name">{selectedLine.definition?.name ?? "Unsupported record type"}</span>
        </div>
        <code className="record-preview">{selectedLine.raw}</code>
      </div>
    </>
  );
}
