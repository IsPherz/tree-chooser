import { AddRecordPanel } from "../components/AddRecordPanel";
import { RecordFileTemplatesPanel } from "../components/RecordFileTemplatesPanel";
import { FieldTable } from "../features/field-table/FieldTable";
import { InfoTooltip } from "../components/InfoTooltip";
import { RecordSelector } from "../components/RecordSelector";
import { SummaryCard } from "../components/SummaryCard";
import { UnknownRecord } from "../components/UnknownRecord";
import { SAMPLE_RECORD_FILE } from "../constants/sampleRecordFile";
import { isWritableFilePickerSupported } from "../diskFile";
import { useRecordFileTemplates } from "../hooks/useRecordFileTemplates";
import { useRecordFileWorkspace } from "../hooks/useRecordFileWorkspace";

export function App() {
  const {
    fileName,
    fileError,
    diskLinkedName,
    parsedLines,
    selectedLine,
    selectedIndex,
    setSelectedIndex,
    showBlankFields,
    setShowBlankFields,
    supportedRecordTypes,
    knownRecordCount,
    unsupportedRecordTypes,
    recognizedRecordTypeText,
    handleFileChange,
    handleOpenFileForDiskSave,
    handleSaveLineEdits,
    fileText,
    createNewRecordFile,
    createNewFromCurrentContent,
    loadTemplateAsNewFile,
    saveCurrentAsTemplate,
    addRecord,
  } = useRecordFileWorkspace(SAMPLE_RECORD_FILE);

  const { templates, saveTemplate, removeTemplate } = useRecordFileTemplates();
  const hasCurrentContent = fileText.length > 0;

  const selectedDefinition = selectedLine?.definition;

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Fixed-width record inspector</p>
          <h1>Review fixed-width records line by line</h1>
          <p className="hero-copy">
            Load a fixed-width record file, pick any line, and see field names, byte ranges, raw values, and layout notes
            for that line&apos;s record type.
          </p>
        </div>
        <div className="hero-file-column">
          <div className="hero-file-actions">
            {isWritableFilePickerSupported() ? (
              <button className="file-open-disk" type="button" onClick={handleOpenFileForDiskSave}>
                Open file (save to disk)
              </button>
            ) : (
              <p className="file-picker-hint">
                Use Chrome or Edge to open a file with permission to write changes back to disk.
              </p>
            )}
            <label className="file-picker">
              <span>Browse (in browser only)</span>
              <input type="file" accept=".txt,.dat,text/plain" onChange={handleFileChange} />
            </label>
          </div>
          {diskLinkedName && (
            <p className="disk-linked-note" role="status">
              Saving to disk: <strong>{diskLinkedName}</strong>
            </p>
          )}
          {fileError && <p className="file-error">{fileError}</p>}
        </div>
      </header>

      <section className="summary-grid" aria-label="Loaded file summary">
        <SummaryCard label="File" value={fileName} />
        <SummaryCard label="Lines" value={parsedLines.length.toString()} />
        <SummaryCard label="Recognized layouts" value={`${knownRecordCount}/${parsedLines.length}`} />
        <SummaryCard
          label="Unsupported layouts"
          value={
            <span className="summary-info-value">
              {unsupportedRecordTypes.length.toString()}
              <InfoTooltip
                label="Unsupported record types"
                text={
                  unsupportedRecordTypes.length > 0
                    ? `Unsupported record types in this file: ${unsupportedRecordTypes.join(", ")}.`
                    : "Every loaded line has a configured record layout."
                }
              />
            </span>
          }
        />
        <SummaryCard
          label="Recognized record types"
          value={
            <span className="summary-info-value">
              {supportedRecordTypes.length} types
              <InfoTooltip
                label="Recognized record types"
                text={`The application can currently identify these record types: ${recognizedRecordTypeText}.`}
              />
            </span>
          }
        />
      </section>

      <section className="workspace">
        <aside className="line-list" aria-label="Records in file">
          <div className="panel-heading">
            <h2>Records</h2>
            <p>Select a line to inspect its layout.</p>
          </div>
          <div className="record-selector">
            <RecordFileTemplatesPanel
              templates={templates}
              hasCurrentContent={hasCurrentContent}
              currentFileLabel={fileName}
              onSaveTemplate={(name) => {
                const payload = saveCurrentAsTemplate(name);
                saveTemplate(payload.name, payload.fileText, payload.lineCount);
              }}
              onLoadTemplate={loadTemplateAsNewFile}
              onNewFileFromCurrent={() => {
                try {
                  createNewFromCurrentContent();
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Could not create a copy.";
                  window.alert(message);
                }
              }}
              onDeleteTemplate={removeTemplate}
            />
            <AddRecordPanel
              selectedIndex={selectedIndex}
              hasRecords={parsedLines.length > 0}
              onCreateNewFile={createNewRecordFile}
              onAddRecord={addRecord}
            />
            {parsedLines.length === 0 ? (
              <p className="empty-state">No records yet. Add a record row above to start.</p>
            ) : (
              <RecordSelector
                lines={parsedLines}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
            )}
          </div>
        </aside>

        <section className="field-panel" aria-live="polite">
          {selectedLine ? (
            <>
              <div className="panel-heading field-heading">
                <div>
                  <h2>{selectedDefinition?.name ?? "Unknown record layout"}</h2>
                  <p>
                    Line {selectedLine.lineNumber} - Record type {selectedLine.recordType || "not found"} -{" "}
                    {selectedLine.raw.length} characters
                  </p>
                </div>
                {selectedDefinition && (
                  <div className="heading-actions">
                    <InfoTooltip
                      label="Record information"
                      text={`${selectedDefinition.content} Requirement: ${selectedDefinition.requirement}.`}
                    />
                    <span className="record-pill">{selectedDefinition.category}</span>
                  </div>
                )}
              </div>

              {selectedDefinition ? (
                <FieldTable
                  line={selectedLine}
                  lineIndex={selectedIndex}
                  showBlankFields={showBlankFields}
                  onShowBlankFieldsChange={setShowBlankFields}
                  onSaveLineEdits={handleSaveLineEdits}
                />
              ) : (
                <UnknownRecord line={selectedLine} />
              )}

              <details className="raw-line">
                <summary>Raw line</summary>
                <code>{selectedLine.raw}</code>
              </details>
            </>
          ) : (
            <p className="empty-state">Choose a file with at least one line.</p>
          )}
        </section>
      </section>
    </main>
  );
}
