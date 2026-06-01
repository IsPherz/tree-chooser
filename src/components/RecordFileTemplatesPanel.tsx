import { useState } from "react";
import type { RecordFileTemplate } from "../templates/recordFileTemplateStorage";

export function RecordFileTemplatesPanel({
  templates,
  hasCurrentContent,
  currentFileLabel,
  onSaveTemplate,
  onLoadTemplate,
  onNewFileFromCurrent,
  onDeleteTemplate,
}: {
  templates: RecordFileTemplate[];
  hasCurrentContent: boolean;
  currentFileLabel: string;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (templateId: string) => void;
  onNewFileFromCurrent: () => void;
  onDeleteTemplate: (templateId: string) => void;
}) {
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  const handleSaveTemplate = () => {
    try {
      onSaveTemplate(templateName);
      setStatus(`Saved template "${templateName.trim()}".`);
      setTemplateName("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the template.";
      setStatus(message);
    }
  };

  const handleLoadTemplate = () => {
    if (!selectedTemplateId) {
      setStatus("Choose a template to load.");
      return;
    }
    try {
      onLoadTemplate(selectedTemplateId);
      const template = templates.find((item) => item.id === selectedTemplateId);
      setStatus(template ? `Loaded "${template.name}" as a new editable file.` : "Template loaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load the template.";
      setStatus(message);
    }
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplateId) {
      return;
    }
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) {
      return;
    }
    if (!window.confirm(`Delete template "${template.name}"?`)) {
      return;
    }
    onDeleteTemplate(selectedTemplateId);
    setSelectedTemplateId(templates.find((item) => item.id !== selectedTemplateId)?.id ?? "");
    setStatus(`Deleted template "${template.name}".`);
  };

  return (
    <section className="templates-panel" aria-label="Record file templates">
      <h3 className="add-record-title">Templates</h3>
      <p className="add-record-copy">
        Save the current file as a reusable layout, or start a new file from a saved template or from what you have open.
      </p>

      <button
        className="new-file-button"
        type="button"
        onClick={onNewFileFromCurrent}
        disabled={!hasCurrentContent}
      >
        New file from current content
      </button>
      {!hasCurrentContent && (
        <p className="templates-hint">Load or build a file first to use it as a base.</p>
      )}
      {hasCurrentContent && (
        <p className="templates-hint">Creates a copy of &quot;{currentFileLabel}&quot; you can edit without overwriting the disk file.</p>
      )}

      <label className="add-record-label" htmlFor="template-save-name">
        Save current file as template
      </label>
      <input
        id="template-save-name"
        className="template-name-input"
        type="text"
        value={templateName}
        placeholder="e.g. Debit batch starter"
        onChange={(event) => setTemplateName(event.target.value)}
      />
      <button
        className="add-record-button"
        type="button"
        onClick={handleSaveTemplate}
        disabled={!templateName.trim() || !hasCurrentContent}
      >
        Save template
      </button>

      <label className="add-record-label" htmlFor="template-select">
        Load saved template
      </label>
      {templates.length === 0 ? (
        <p className="templates-hint">No templates saved yet.</p>
      ) : (
        <>
          <select
            id="template-select"
            className="add-record-select"
            value={selectedTemplateId}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.lineCount} lines)
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="add-record-meta">
              Updated {new Date(selectedTemplate.updatedAt).toLocaleString()}
            </p>
          )}
          <div className="template-actions">
            <button className="add-record-button" type="button" onClick={handleLoadTemplate} disabled={!selectedTemplateId}>
              Load as new file
            </button>
            <button className="template-delete-button" type="button" onClick={handleDeleteTemplate} disabled={!selectedTemplateId}>
              Delete
            </button>
          </div>
        </>
      )}

      {status && <p className="add-record-status">{status}</p>}
    </section>
  );
}
