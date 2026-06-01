import { useState } from "react";
import { recordDefinitions, supportedRecordCodes } from "../data/recordDefinitions";

export type RecordInsertPosition = "end" | "after-selection";

export function AddRecordPanel({
  selectedIndex,
  hasRecords,
  onCreateNewFile,
  onAddRecord,
}: {
  selectedIndex: number;
  hasRecords: boolean;
  onCreateNewFile: () => void;
  onAddRecord: (recordCode: string, insertPosition: RecordInsertPosition) => Promise<void>;
}) {
  const [recordCode, setRecordCode] = useState(supportedRecordCodes[0] ?? "");
  const [insertPosition, setInsertPosition] = useState<RecordInsertPosition>("end");
  const [status, setStatus] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const selectedDefinition = recordCode ? recordDefinitions[recordCode] : undefined;

  const handleAddRecord = async () => {
    if (!recordCode) {
      setStatus("Choose a record type first.");
      return;
    }

    setIsAdding(true);
    setStatus(null);
    try {
      await onAddRecord(recordCode, insertPosition);
      setStatus(`Added empty ${recordCode} record. Edit fields and save when ready.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add the record.";
      setStatus(message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section className="add-record-panel" aria-label="Create or extend record file">
      <h3 className="add-record-title">Build record file</h3>
      <p className="add-record-copy">Start a new file or append blank rows using a configured record layout.</p>

      <button className="new-file-button" type="button" onClick={onCreateNewFile}>
        New record file
      </button>

      <label className="add-record-label" htmlFor="add-record-type">
        Record type
      </label>
      <select
        id="add-record-type"
        className="add-record-select"
        value={recordCode}
        onChange={(event) => setRecordCode(event.target.value)}
      >
        {supportedRecordCodes.map((code) => (
          <option key={code} value={code}>
            {code} — {recordDefinitions[code]?.name ?? "Unknown"}
          </option>
        ))}
      </select>

      {selectedDefinition && (
        <p className="add-record-meta">
          {selectedDefinition.category} · {selectedDefinition.requirement}
        </p>
      )}

      <fieldset className="insert-position-fieldset">
        <legend>Insert position</legend>
        <label className="insert-position-option">
          <input
            type="radio"
            name="insert-position"
            value="end"
            checked={insertPosition === "end"}
            onChange={() => setInsertPosition("end")}
          />
          End of file
        </label>
        <label className="insert-position-option">
          <input
            type="radio"
            name="insert-position"
            value="after-selection"
            checked={insertPosition === "after-selection"}
            disabled={!hasRecords}
            onChange={() => setInsertPosition("after-selection")}
          />
          After line {hasRecords ? selectedIndex + 1 : "—"}
        </label>
      </fieldset>

      <button className="add-record-button" type="button" onClick={handleAddRecord} disabled={isAdding || !recordCode}>
        {isAdding ? "Adding…" : "Add record row"}
      </button>

      {status && <p className="add-record-status">{status}</p>}
    </section>
  );
}
