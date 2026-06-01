# TreeChooser — Fixed-Width Record Viewer

**Repository:** [github.com/IsPherz/tree-chooser](https://github.com/IsPherz/tree-chooser) (public)

A local web app for inspecting, editing, and building fixed-width record files (one record per line, fixed byte positions per field).

Load a record file, review any line by field name and byte position, edit values with validation, save back to disk (in supported browsers), compose new files row by row, and reuse saved templates in the browser.

The app ships with a sample file and configurable field layouts. Layouts can be extended in code for additional record types.

## Run locally

Requires **Node.js 20.19+** or **22.12+** (Vite 8). If you use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm), run `nvm use` or `fnm use` in this folder (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Build

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Using the app

### Open a file

Two ways to load content:

| Action | What it does |
|--------|----------------|
| **Open file (save to disk)** | Chrome or Edge only. Pick a file and grant read/write access. Edits can be written back to that same file on disk (for example, visible in VS Code after reload). |
| **Browse (in browser only)** | Read-only in the browser. **Save edits** updates the in-memory copy only; the file on disk does not change. |

When disk save is active, the header shows **Saving to disk:** with the linked filename.

Accepted extensions: `.txt`, `.dat`, and plain text.

### Inspect records

- Use the **Records** list or dropdown to select a line.
- The main panel shows the record name, type, line length, and a field table.
- Hover or focus the **i** icons for field and record descriptions.
- Open **Raw line** to see the full fixed-width string for the selected row.
- Summary cards at the top show file name, line count, recognized vs unsupported layouts, and which record types are configured.

### Field table

- Columns can be **dragged** to reorder and **resized** from the header edge.
- **Show blank fields** reveals space-filled or empty-looking fields; when off, blank fields are hidden with a count of how many were hidden.
- **Value** cells are editable for supported record layouts.

### Edit fields and validation

Each field is validated by its layout **type** and **length**:

| Type | Rules |
|------|--------|
| Numeric, Amount, Date, Time | Digits only; must be exactly the field length |
| Sign | `+` or `-` only; exact length |
| Character, Reserved | Any characters; max length enforced while typing |

- Spaces count as characters and are preserved (including trailing spaces).
- Typing past the max length is blocked and shows an immediate warning.
- **Save edits** on the current line is disabled until all fields on that line pass validation.

### Save edits

1. Change values in the **Value** column for the selected line.
2. Click **Save edits**.

Outcome depends on how the file was opened:

- **Disk-linked file:** the full file is rewritten on disk; status shows *Edits saved to disk.*
- **Browse-only:** only the copy in the app changes; status reminds you to use **Open file (save to disk)** to persist to a real file.

Saving updates one line at a time and rebuilds the fixed-width row from all fields on that record (with correct padding: zeros for numeric types, spaces for character fields).

### Build a new record file

In the **Build record file** section:

1. **New record file** — starts an empty file (no rows).
2. Choose a **record type** from the list of configured layouts (for example `020`, `070`, `320`).
3. Choose **Insert position**: end of file, or after the currently selected line.
4. Click **Add record row** — inserts a blank 200-byte row for that layout (sequence number, record type, and length are prefilled; other fields use zeros or spaces as appropriate).
5. Select the new line, edit fields, and **Save edits**.

Only record types defined in `src/data/recordDefinitions.ts` appear in the dropdown.

### Templates

Templates store the **full file text** in your browser (`localStorage`) so you can reuse a starting layout without committing it to the repo.

| Action | What it does |
|--------|----------------|
| **Save template** | Saves the current file content under the name you enter. Same name updates the existing template. |
| **Load as new file** | Opens a **copy** of the template as a new editable file (does not change the saved template). |
| **New file from current content** | Duplicates what you have open into a new working file (for example `sample-records-copy.txt`) and clears the disk link so you do not overwrite the original file by mistake. |
| **Delete** | Removes the template from browser storage. |

Typical workflow: load or build a file → **Save template** → later **Load as new file** → edit rows → **Open file (save to disk)** to write a new file on disk.

Templates are per browser and per machine; they are not synced to Git or shared with other users automatically.

## Browser notes

- **Best experience:** Chrome or Edge (disk read/write via File System Access API).
- **Firefox / Safari:** use **Browse** and treat the app as an editor for an in-memory copy; export changes by copying from **Raw line** or use a Chromium browser to save to disk.
- Node version is checked automatically when you run `npm run dev` or `npm run build`.

## Project layout (for contributors)

| Path | Purpose |
|------|---------|
| `src/app/App.tsx` | Main page layout |
| `src/hooks/useRecordFileWorkspace.ts` | File state, parsing, disk I/O, templates integration |
| `src/features/field-table/` | Editable field table, validation, line builder |
| `src/data/recordDefinitions.ts` | Fixed-width layouts per record type |
| `src/parser.ts` | Line and field parsing |
| `src/diskFile.ts` | Disk open/write helpers |
| `src/templates/recordFileTemplateStorage.ts` | Browser template storage |
| `src/recordLineBuilder.ts` | Empty row generation |

## Supported record layouts

The catalog currently covers commonly needed starter layouts:

- `020` debit file header
- `070` MID/batch header record 1
- `071` MID/batch header record 2
- `320` debit POS reconciliation detail record 1
- `321` debit POS reconciliation detail record 2
- `R00` credit reclass record 1
- `910` credit file trailer
- `920` debit file trailer
- `970` MID/batch trailer

Add more by extending `src/data/recordDefinitions.ts` with fixed-width positions from your layout specification.

## Adding record layouts manually

Record layouts live in `src/data/recordDefinitions.ts`. Each layout is a fixed-width field map based on the guide's `Start` and `Length` columns.

To add a new record type:

1. From the reference guide, note:
   - record type code (for example `R00`)
   - record name
   - requirement text
   - record content/description
   - every field's start position, length, data type, and description
2. Create a new `FieldDefinition[]` constant in `src/data/recordDefinitions.ts`.
3. Start the layout with `...controlFields("...")` when the record uses the standard first 15 characters:
   - positions `1-9`: record sequence number
   - positions `10-12`: record type identifier
   - positions `13-15`: record length
4. Add each reporting field using 1-based fixed-width positions from the guide.
5. Register the layout in the `definitions` array.
6. Run `npm run build` to type-check and verify the app still builds.

Example:

```ts
const exampleRecordFields: FieldDefinition[] = [
  ...controlFields("ABC identifies Example Record 1."),
  {
    name: "Transaction Date",
    start: 16,
    length: 8,
    type: "Date",
    description: "Transaction date in MMDDCCYY format.",
  },
  {
    name: "Amount",
    start: 24,
    length: 11,
    type: "Amount",
    description: "Amount in DDDDDDDDDCC format.",
  },
];

const definitions: RecordDefinition[] = [
  // existing definitions...
  {
    code: "ABC",
    name: "Example Record 1",
    category: "Example activity",
    requirement: "Optional",
    content: "Short description shown in the record info tooltip.",
    fields: exampleRecordFields,
  },
];
```

Field positions are 1-based and inclusive in the guide. The parser calculates the end position as `start + length - 1`, so only `start` and `length` are needed.

Valid field `type` values are:

- `Character`
- `Numeric`
- `Amount`
- `Date`
- `Time`
- `Sign`
- `Reserved`

## License

MIT — see [LICENSE](LICENSE).
