// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { CellRef } from "./CellRef";
import type { Error } from "./Error";
import type { Value } from "./Value";

export type CodeCellRunResult = { output_value: Value, cells_accessed: Array<CellRef>, } | { error: Error, };