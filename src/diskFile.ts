export function isWritableFilePickerSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";
}

export function detectPreferredLineEnding(text: string): "\r\n" | "\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

export function splitFileLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0);
}

export function joinFileLines(lines: string[], lineEnding: "\r\n" | "\n"): string {
  if (lines.length === 0) {
    return "";
  }
  return lines.join(lineEnding);
}

export function replaceLineInFileText(
  currentText: string,
  lineIndex: number,
  nextRawLine: string,
  lineEnding: "\r\n" | "\n",
): string {
  const normalizedLines = splitFileLines(currentText);

  if (lineIndex < 0 || lineIndex >= normalizedLines.length) {
    return currentText;
  }

  normalizedLines[lineIndex] = nextRawLine;
  return joinFileLines(normalizedLines, lineEnding);
}

export function insertRecordLineInFileText(
  currentText: string,
  newLine: string,
  lineEnding: "\r\n" | "\n",
  insertAfterIndex: number | null,
): string {
  const lines = splitFileLines(currentText);
  if (insertAfterIndex === null || insertAfterIndex < 0 || insertAfterIndex >= lines.length) {
    lines.push(newLine);
  } else {
    lines.splice(insertAfterIndex + 1, 0, newLine);
  }
  return joinFileLines(lines, lineEnding);
}

export async function openTextFileForReadWrite(): Promise<{
  handle: FileSystemFileHandle;
  name: string;
  text: string;
}> {
  const picker = window.showOpenFilePicker;
  if (!picker) {
    throw new Error("This browser does not support opening files for saving.");
  }

  const [handle] = await picker({
    types: [
      {
        description: "Fixed-width record files",
        accept: {
          "text/plain": [".txt", ".dat"],
        },
      },
    ],
    multiple: false,
  });

  const file = await handle.getFile();
  const text = await file.text();
  const granted = await ensureWritePermission(handle);
  if (!granted) {
    throw new Error("Write permission is required to save changes back to this file.");
  }

  return { handle, name: file.name, text };
}

export async function writeTextToFileHandle(handle: FileSystemFileHandle, contents: string): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(contents);
  } finally {
    await writable.close();
  }
}

async function ensureWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const descriptor = { mode: "readwrite" as const };
  let permission = await handle.queryPermission(descriptor);
  if (permission === "granted") {
    return true;
  }
  permission = await handle.requestPermission(descriptor);
  return permission === "granted";
}
