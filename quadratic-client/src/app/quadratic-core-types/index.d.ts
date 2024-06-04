// This file is automatically generated by quadratic-core/src/bin/export_types.rs
// Do not modify it manually.

export type CodeCellLanguage = "Python" | "Formula";
export interface JsHtmlOutput { sheet_id: string, x: bigint, y: bigint, html: string | null, w: string | null, h: string | null, }
export interface JsCodeCell { x: bigint, y: bigint, code_string: string, language: CodeCellLanguage, std_out: string | null, std_err: string | null, evaluation_result: string | null, spill_error: Array<Pos> | null, return_info: JsReturnInfo | null, cells_accessed: Array<SheetRect> | null, }
export interface JsRenderCodeCell { x: number, y: number, w: number, h: number, language: CodeCellLanguage, state: JsRenderCodeCellState, spill_error: Array<Pos> | null, }
export type JsRenderCodeCellState = "NotYetRun" | "RunError" | "SpillError" | "Success";
export type JsRenderCellSpecial = "Chart" | "SpillError" | "RunError" | "True" | "False";
export interface JsRenderCell { x: bigint, y: bigint, value: string, language?: CodeCellLanguage, align?: CellAlign, wrap?: CellWrap, bold?: boolean, italic?: boolean, textColor?: string, special: JsRenderCellSpecial | null, }
export type RangeRef = { "type": "RowRange", start: CellRefCoord, end: CellRefCoord, sheet: string | null, } | { "type": "ColRange", start: CellRefCoord, end: CellRefCoord, sheet: string | null, } | { "type": "CellRange", start: CellRef, end: CellRef, } | { "type": "Cell", pos: CellRef, };
export interface CellRef { sheet: string | null, x: CellRefCoord, y: CellRefCoord, }
export type CellRefCoord = { "type": "Relative", "coord": bigint } | { "type": "Absolute", "coord": bigint };
export type GridBounds = { "type": "empty" } | { "type": "nonEmpty" } & Rect;
export type CellAlign = "center" | "left" | "right";
export type CellWrap = "overflow" | "wrap" | "clip";
export interface NumericFormat { type: NumericFormatKind, symbol: string | null, }
export type NumericFormatKind = "NUMBER" | "CURRENCY" | "PERCENTAGE" | "EXPONENTIAL";
export interface SheetId { id: string, }
export interface JsRenderCell { x: bigint, y: bigint, value: string, language?: CodeCellLanguage, align?: CellAlign, wrap?: CellWrap, bold?: boolean, italic?: boolean, textColor?: string, special: JsRenderCellSpecial | null, }
export interface JsRenderFill { x: bigint, y: bigint, w: number, h: number, color: string, }
export interface CellFormatSummary { bold: boolean | null, italic: boolean | null, commas: boolean | null, textColor: string | null, fillColor: string | null, }
export interface JsClipboard { plainText: string, html: string, }
export interface ArraySize { w: number, h: number, }
export type Axis = "X" | "Y";
export interface Instant { seconds: number, }
export interface Duration { years: number, months: number, seconds: number, }
export interface RunError { span: Span | null, msg: RunErrorMsg, }
export type RunErrorMsg = { "PythonError": string } | "Spill" | "Unimplemented" | "UnknownError" | { "InternalError": string } | { "Unterminated": string } | { "Expected": { expected: string, got: string | null, } } | { "Unexpected": string } | { "TooManyArguments": { func_name: string, max_arg_count: number, } } | { "MissingRequiredArgument": { func_name: string, arg_name: string, } } | "BadFunctionName" | "BadCellReference" | "BadNumber" | { "ExactArraySizeMismatch": { expected: ArraySize, got: ArraySize, } } | { "ExactArrayAxisMismatch": { axis: Axis, expected: number, got: number, } } | { "ArrayAxisMismatch": { axis: Axis, expected: number, got: number, } } | "EmptyArray" | "NonRectangularArray" | "NonLinearArray" | "ArrayTooBig" | "CircularReference" | "Overflow" | "DivideByZero" | "NegativeExponent" | "NotANumber" | "Infinity" | "IndexOutOfBounds" | "NoMatch" | "InvalidArgument";
export interface Pos { x: bigint, y: bigint, }
export interface Rect { min: Pos, max: Pos, }
export interface Span { start: number, end: number, }
export interface SearchOptions { case_sensitive?: boolean, whole_cell?: boolean, search_code?: boolean, sheet_id?: string, }
export interface SheetPos { x: bigint, y: bigint, sheet_id: SheetId, }
export interface SheetRect { min: Pos, max: Pos, sheet_id: SheetId, }
export interface Selection { sheet_id: SheetId, x: bigint, y: bigint, rects: Array<Rect> | null, rows: Array<bigint> | null, columns: Array<bigint> | null, all: boolean, }
export interface Placement { index: number, position: number, size: number, }
export interface ColumnRow { column: number, row: number, }
export interface SheetInfo { sheet_id: string, name: string, order: string, color: string | null, offsets: string, bounds: GridBounds, bounds_without_formatting: GridBounds, }
export type PasteSpecial = "None" | "Values" | "Formats";
export interface Rgba { red: number, green: number, blue: number, alpha: number, }
export type CellBorderLine = "line1" | "line2" | "line3" | "dotted" | "dashed" | "double";
export type BorderSelection = "all" | "inner" | "outer" | "horizontal" | "vertical" | "left" | "top" | "right" | "bottom" | "clear";
export interface BorderStyle { color: Rgba, line: CellBorderLine, }
export interface JsRenderBorder { x: bigint, y: bigint, w?: number, h?: number, style: BorderStyle, }
export interface JsRenderBorders { horizontal: Array<JsRenderBorder>, vertical: Array<JsRenderBorder>, }
export interface JsCodeResult { transaction_id: string, success: boolean, error_msg: string | null, input_python_std_out: string | null, output_value: Array<string> | null, array_output: Array<Array<Array<string>>> | null, line_number: number | null, output_type: string | null, cancel_compute: boolean | null, }
export interface MinMax { min: number, max: number, }
export interface TransientResize { row: bigint | null, column: bigint | null, old_size: number, new_size: number, }
export interface SheetBounds { sheet_id: string, bounds: GridBounds, bounds_without_formatting: GridBounds, }
export type TransactionName = "Unknown" | "ResizeColumn" | "ResizeRow" | "Autocomplete" | "SetBorders" | "SetCells" | "SetFormats" | "CutClipboard" | "PasteClipboard" | "SetCode" | "RunCode" | "Import" | "SetSheetMetadata" | "SheetAdd" | "SheetDelete" | "DuplicateSheet" | "MoveCells";
export interface JsGetCellResponse { x: bigint, y: bigint, value: string, type_name: string, }
export interface SummarizeSelectionResult { count: bigint, sum: number | null, average: number | null, }
export interface Format { align: CellAlign | null, wrap: CellWrap | null, numeric_format: NumericFormat | null, numeric_decimals: number | null, numeric_commas: boolean | null, bold: boolean | null, italic: boolean | null, text_color: string | null, fill_color: string | null, render_size: RenderSize | null, }
export interface JsSheetFill { columns: Array<[bigint, [string, bigint]]>, rows: Array<[bigint, [string, bigint]]>, all: string | null, }
