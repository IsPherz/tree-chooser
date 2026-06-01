import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { RecordInsertPosition } from "../components/AddRecordPanel";
import { recordDefinitions } from "../data/recordDefinitions";
import {
  detectPreferredLineEnding,
  insertRecordLineInFileText,
  openTextFileForReadWrite,
  replaceLineInFileText,
  splitFileLines,
  writeTextToFileHandle,
} from "../diskFile";
import { parseRecordFileText } from "../parser";
import { buildEmptyRecordLine, getNextRecordSequenceNumber } from "../recordLineBuilder";
import { getRecordFileTemplate } from "../templates/recordFileTemplateStorage";
import type { SaveLineEditsResult } from "../features/field-table/types";

export function useRecordFileWorkspace(initialFileText: string, initialFileLabel = "sample-records.txt") {
  const [fileName, setFileName] = useState(initialFileLabel);
  const [fileText, setFileText] = useState(initialFileText);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBlankFields, setShowBlankFields] = useState(false);
  const [diskLinkedName, setDiskLinkedName] = useState<string | null>(null);

  const parsedLines = useMemo(() => parseRecordFileText(fileText), [fileText]);
  const selectedLine = parsedLines[selectedIndex] ?? parsedLines[0];
  const supportedRecordTypes = useMemo(() => Object.keys(recordDefinitions).sort(), []);

  const fileReadSequence = useRef(0);
  const diskFileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const lineEndingRef = useRef<"\r\n" | "\n">("\n");

  useEffect(() => {
    if (selectedIndex >= parsedLines.length) {
      setSelectedIndex(0);
    }
  }, [parsedLines.length, selectedIndex]);

  const knownRecordCount = parsedLines.filter((line) => line.definition).length;
  const unsupportedRecordTypes = useMemo(
    () =>
      [...new Set(parsedLines.filter((line) => !line.definition).map((line) => line.recordType || "(missing)"))].sort(),
    [parsedLines],
  );
  const recognizedRecordTypeText = supportedRecordTypes.join(", ");

  const applyWorkspaceContent = (nextFileText: string, nextFileName: string) => {
    fileReadSequence.current += 1;
    setFileError(null);
    diskFileHandleRef.current = null;
    setDiskLinkedName(null);
    setFileName(nextFileName);
    setShowBlankFields(false);
    setSelectedIndex(0);
    lineEndingRef.current = detectPreferredLineEnding(nextFileText);
    setFileText(nextFileText);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const readId = fileReadSequence.current + 1;
    fileReadSequence.current = readId;
    setFileError(null);
    setFileName(file.name);
    diskFileHandleRef.current = null;
    setDiskLinkedName(null);
    setSelectedIndex(0);
    setShowBlankFields(false);
    setFileText("");

    try {
      const nextFileText = await file.text();
      if (fileReadSequence.current === readId) {
        lineEndingRef.current = detectPreferredLineEnding(nextFileText);
        setFileText(nextFileText);
      }
    } catch {
      if (fileReadSequence.current === readId) {
        setFileError(`Could not read ${file.name}. Please choose the file again.`);
      }
    } finally {
      input.value = "";
    }
  };

  const handleOpenFileForDiskSave = async () => {
    setFileError(null);
    const readId = fileReadSequence.current + 1;
    fileReadSequence.current = readId;
    try {
      const { handle, name, text } = await openTextFileForReadWrite();
      if (fileReadSequence.current !== readId) {
        return;
      }
      diskFileHandleRef.current = handle;
      setDiskLinkedName(name);
      setFileName(name);
      setSelectedIndex(0);
      setShowBlankFields(false);
      lineEndingRef.current = detectPreferredLineEnding(text);
      setFileText(text);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (fileReadSequence.current === readId) {
        const message =
          error instanceof Error ? error.message : "Could not open the file for saving. Try again or use Browse.";
        setFileError(message);
      }
    }
  };

  const createNewRecordFile = () => {
    applyWorkspaceContent("", "untitled-records.txt");
  };

  const createNewFromCurrentContent = () => {
    if (!fileText.trim() && splitFileLines(fileText).length === 0) {
      throw new Error("There is no content to copy. Load or build a file first.");
    }
    const baseLabel = fileName.replace(/\.(txt|dat)$/i, "") || "records";
    applyWorkspaceContent(fileText, `${baseLabel}-copy.txt`);
  };

  const loadTemplateAsNewFile = (templateId: string) => {
    const template = getRecordFileTemplate(templateId);
    if (!template) {
      throw new Error("Template not found. It may have been deleted.");
    }
    const safeName = template.name.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "template";
    applyWorkspaceContent(template.fileText, `${safeName}-from-template.txt`);
  };

  const saveCurrentAsTemplate = (name: string) => {
    const lineCount = splitFileLines(fileText).length;
    return { name: name.trim(), fileText, lineCount };
  };

  const addRecord = async (recordCode: string, insertPosition: RecordInsertPosition) => {
    if (!recordDefinitions[recordCode]) {
      throw new Error(`Record type ${recordCode} is not configured.`);
    }

    setFileError(null);
    const lineEnding = lineEndingRef.current;
    let nextText = "";
    let nextSelectedIndex = 0;

    setFileText((currentText) => {
      const lines = splitFileLines(currentText);
      const sequenceNumber = getNextRecordSequenceNumber(lines);
      const newLine = buildEmptyRecordLine(recordCode, sequenceNumber);
      const insertAfterIndex =
        insertPosition === "after-selection" && lines.length > 0 ? selectedIndex : null;

      nextText = insertRecordLineInFileText(currentText, newLine, lineEnding, insertAfterIndex);
      const nextLines = splitFileLines(nextText);
      nextSelectedIndex =
        insertAfterIndex === null ? nextLines.length - 1 : Math.min(insertAfterIndex + 1, nextLines.length - 1);
      return nextText;
    });

    setSelectedIndex(nextSelectedIndex);

    const handle = diskFileHandleRef.current;
    if (!handle) {
      return;
    }

    try {
      await writeTextToFileHandle(handle, nextText);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not write the new record to disk.";
      setFileError(message);
      throw new Error(message);
    }
  };

  const handleSaveLineEdits = async (
    lineIndex: number,
    nextRawLine: string,
  ): Promise<SaveLineEditsResult> => {
    const lineEnding = lineEndingRef.current;
    let nextText = "";

    setFileText((currentText) => {
      nextText = replaceLineInFileText(currentText, lineIndex, nextRawLine, lineEnding);
      return nextText;
    });

    const handle = diskFileHandleRef.current;
    if (!handle) {
      return { diskWritten: false };
    }

    try {
      await writeTextToFileHandle(handle, nextText);
      return { diskWritten: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not write to the file on disk.";
      return { diskWritten: false, errorMessage: message };
    }
  };

  return {
    fileName,
    fileText,
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
    createNewRecordFile,
    createNewFromCurrentContent,
    loadTemplateAsNewFile,
    saveCurrentAsTemplate,
    addRecord,
  };
}
