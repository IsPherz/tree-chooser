import {
  useEffect,
  useMemo,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ParsedField, ParsedLine } from "../../parser";
import {
  defaultColumnOrder,
  defaultColumnWidths,
  fieldColumns,
  type FieldColumn,
  type FieldColumnId,
} from "./fieldColumns";
import { createInitialFieldInputs, isTextInsertionKey } from "./fieldInputHelpers";
import type { SaveLineEditsResult } from "./types";
import { getFieldValidationError } from "./fieldValidation";
import { buildRawLineFromInputs } from "./lineBuilder";

export function FieldTable({
  line,
  lineIndex,
  showBlankFields,
  onShowBlankFieldsChange,
  onSaveLineEdits,
}: {
  line: ParsedLine;
  lineIndex: number;
  showBlankFields: boolean;
  onShowBlankFieldsChange: (showBlankFields: boolean) => void;
  onSaveLineEdits: (lineIndex: number, nextRawLine: string) => Promise<SaveLineEditsResult>;
}) {
  const [columnOrder, setColumnOrder] = useState<FieldColumnId[]>(defaultColumnOrder);
  const [columnWidths, setColumnWidths] = useState<Record<FieldColumnId, number>>(defaultColumnWidths);
  const [draggedColumn, setDraggedColumn] = useState<FieldColumnId | null>(null);
  const [fieldInputs, setFieldInputs] = useState<Record<number, string>>(() => createInitialFieldInputs(line));
  const [maxLengthWarnings, setMaxLengthWarnings] = useState<Record<number, string>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const blankFieldCount = line.fields.filter((field) => field.isBlank).length;
  const values = showBlankFields ? line.fields : line.fields.filter((field) => !field.isBlank);
  const orderedColumns = columnOrder.map((columnId) => fieldColumns.find((column) => column.id === columnId)!);
  const tableWidth = orderedColumns.reduce((total, column) => total + columnWidths[column.id], 0);
  const fieldErrors = useMemo(() => {
    const nextErrors: Record<number, string> = {};
    for (const field of line.fields) {
      const inputValue = fieldInputs[field.start] ?? "";
      const error = getFieldValidationError(field, inputValue);
      if (error) {
        nextErrors[field.start] = error;
      }
    }
    return nextErrors;
  }, [fieldInputs, line.fields]);
  const hasErrors = Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    setFieldInputs(createInitialFieldInputs(line));
    setMaxLengthWarnings({});
    setSaveStatus(null);
  }, [line.id]);

  const handleColumnDrop = (targetColumn: FieldColumnId) => {
    if (!draggedColumn || draggedColumn === targetColumn) {
      setDraggedColumn(null);
      return;
    }

    setColumnOrder((currentOrder) => {
      const nextOrder = currentOrder.filter((columnId) => columnId !== draggedColumn);
      const targetIndex = nextOrder.indexOf(targetColumn);
      nextOrder.splice(targetIndex, 0, draggedColumn);
      return nextOrder;
    });
    setDraggedColumn(null);
  };

  const handleResizeStart = (event: ReactPointerEvent<HTMLSpanElement>, column: FieldColumn) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[column.id];
    const pointerId = event.pointerId;
    const target = event.currentTarget;

    target.setPointerCapture(pointerId);

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const nextWidth = Math.max(column.minWidth, startWidth + moveEvent.clientX - startX);
      setColumnWidths((currentWidths) => ({
        ...currentWidths,
        [column.id]: nextWidth,
      }));
    };

    const handlePointerUp = () => {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleInputChange = (fieldStart: number, value: string) => {
    setFieldInputs((current) => ({
      ...current,
      [fieldStart]: value,
    }));
    setMaxLengthWarnings((currentWarnings) => {
      if (!currentWarnings[fieldStart]) {
        return currentWarnings;
      }
      const nextWarnings = { ...currentWarnings };
      delete nextWarnings[fieldStart];
      return nextWarnings;
    });
    setSaveStatus(null);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, field: ParsedField) => {
    if (!isTextInsertionKey(event)) {
      return;
    }

    const input = event.currentTarget;
    const currentValue = input.value;
    const selectedLength = Math.max((input.selectionEnd ?? 0) - (input.selectionStart ?? 0), 0);
    const nextLength = currentValue.length - selectedLength + 1;

    if (nextLength > field.length) {
      event.preventDefault();
      setMaxLengthWarnings((currentWarnings) => ({
        ...currentWarnings,
        [field.start]: `Maximum length is ${field.length}.`,
      }));
    }
  };

  const handleInputPaste = (event: ClipboardEvent<HTMLInputElement>, field: ParsedField) => {
    const input = event.currentTarget;
    const currentValue = input.value;
    const selectedLength = Math.max((input.selectionEnd ?? 0) - (input.selectionStart ?? 0), 0);
    const pastedText = event.clipboardData.getData("text");
    const allowedLength = field.length - (currentValue.length - selectedLength);

    if (pastedText.length > allowedLength) {
      event.preventDefault();
      const nextStart = input.selectionStart ?? currentValue.length;
      const nextEnd = input.selectionEnd ?? currentValue.length;
      const clippedPaste = pastedText.slice(0, Math.max(allowedLength, 0));
      const clippedValue = `${currentValue.slice(0, nextStart)}${clippedPaste}${currentValue.slice(nextEnd)}`;

      handleInputChange(field.start, clippedValue);
      setMaxLengthWarnings((currentWarnings) => ({
        ...currentWarnings,
        [field.start]: `Maximum length is ${field.length}.`,
      }));
    }
  };

  const handleSave = async () => {
    if (hasErrors) {
      setSaveStatus("Fix validation errors before saving.");
      return;
    }

    const nextRawLine = buildRawLineFromInputs(line.fields, fieldInputs);
    setSaveStatus("Saving…");
    const result = await onSaveLineEdits(lineIndex, nextRawLine);
    if (result.errorMessage) {
      setSaveStatus(result.errorMessage);
      return;
    }
    if (result.diskWritten) {
      setSaveStatus("Edits saved to disk.");
    } else {
      setSaveStatus("Edits saved in this tab only. Use Open file (save to disk) to write to your file.");
    }
  };

  return (
    <>
      <div className="field-table-controls">
        <div className="table-controls-left">
          <label className="blank-fields-toggle">
            <input
              type="checkbox"
              checked={showBlankFields}
              onChange={(event) => onShowBlankFieldsChange(event.target.checked)}
            />
            Show blank fields
          </label>
          {!showBlankFields && blankFieldCount > 0 && (
            <span className="hidden-field-count">{blankFieldCount} blank fields hidden</span>
          )}
        </div>
        <div className="table-controls-right">
          <button className="save-edits-button" type="button" onClick={handleSave} disabled={hasErrors}>
            Save edits
          </button>
          {saveStatus && <span className={hasErrors ? "save-status error" : "save-status"}>{saveStatus}</span>}
        </div>
      </div>

      {values.length > 0 ? (
        <div className="table-wrap">
          <table className="field-table" style={{ width: tableWidth, minWidth: tableWidth }}>
            <colgroup>
              {orderedColumns.map((column) => (
                <col key={column.id} style={{ width: columnWidths[column.id] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {orderedColumns.map((column) => (
                  <th
                    key={column.id}
                    draggable
                    onDragStart={() => setDraggedColumn(column.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleColumnDrop(column.id)}
                    onDragEnd={() => setDraggedColumn(null)}
                    className={draggedColumn === column.id ? "draggable-header dragging" : "draggable-header"}
                    scope="col"
                  >
                    <span className="column-header-content">{column.label}</span>
                    <span
                      className="column-resizer"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${column.label} column`}
                      onPointerDown={(event) => handleResizeStart(event, column)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {values.map((field) => (
                <tr key={`${field.start}-${field.name}`}>
                  {orderedColumns.map((column) => (
                    <td key={column.id} className={`field-cell field-cell-${column.id}`}>
                      {column.id === "value" ? (
                        <div className="editable-value-cell">
                          <input
                            className={fieldErrors[field.start] ? "field-value-input invalid" : "field-value-input"}
                            type="text"
                            value={fieldInputs[field.start] ?? ""}
                            onChange={(event) => handleInputChange(field.start, event.target.value)}
                            onKeyDown={(event) => handleInputKeyDown(event, field)}
                            onPaste={(event) => handleInputPaste(event, field)}
                            maxLength={field.length}
                            aria-label={`${field.name} value`}
                          />
                          {(fieldErrors[field.start] || maxLengthWarnings[field.start]) && (
                            <span className="field-input-error">
                              {fieldErrors[field.start] ?? maxLengthWarnings[field.start]}
                            </span>
                          )}
                        </div>
                      ) : (
                        column.render(field)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">All fields for this line are blank. Enable "Show blank fields" to view them.</p>
      )}
    </>
  );
}
