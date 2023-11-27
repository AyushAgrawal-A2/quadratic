use std::ops::Range;

use indexmap::IndexSet;

use crate::{
    controller::{
        operation::Operation,
        transaction_summary::{CellSheetsModified, TransactionSummary},
        GridController,
    },
    grid::{CellRef, CodeCellValue, Sheet},
    Pos, Rect, Value,
};

/// updates code cell value
/// returns true if the code cell was successful
pub fn update_code_cell_value(
    grid_controller: &mut GridController,
    cell_ref: CellRef,
    updated_code_cell_value: Option<CodeCellValue>,
    cells_to_compute: &mut IndexSet<CellRef>,
    reverse_operations: &mut Vec<Operation>,
    summary: &mut TransactionSummary,
) -> bool {
    let mut success = false;
    summary.save = true;
    let sheet = grid_controller.grid.sheet_mut_from_id(cell_ref.sheet);
    if let Some(pos) = sheet.cell_ref_to_pos(cell_ref) {
        let old_code_cell_value = sheet.set_code_cell_value(pos, &updated_code_cell_value);
        if old_code_cell_value.as_ref().is_some_and(|code_cell_value| {
            code_cell_value
                .get_output_value(0, 0)
                .is_some_and(|cell_value| cell_value.is_html())
        }) {
            summary.html.insert(sheet.id);
        }
        if let Some(updated_code_cell_value) = updated_code_cell_value.clone() {
            if let Some(output) = updated_code_cell_value.output {
                match output.result.output_value() {
                    Some(output_value) => {
                        success = true;
                        match output_value {
                            Value::Array(array) => {
                                for x in 0..array.width() {
                                    let column_id =
                                        sheet.get_or_create_column(pos.x + x as i64).0.id;
                                    for y in 0..array.height() {
                                        summary.cell_sheets_modified.insert(
                                            CellSheetsModified::new(
                                                sheet.id,
                                                Pos {
                                                    x: pos.x,
                                                    y: pos.y + y as i64,
                                                },
                                            ),
                                        );
                                        let row_id = sheet.get_or_create_row(pos.y + y as i64).id;
                                        // add all but the first cell to the compute cycle
                                        if x != 0 || y != 0 {
                                            cells_to_compute.insert(CellRef {
                                                sheet: sheet.id,
                                                column: column_id,
                                                row: row_id,
                                            });
                                        }
                                    }
                                }
                            }
                            Value::Single(value) => {
                                summary
                                    .cell_sheets_modified
                                    .insert(CellSheetsModified::new(sheet.id, pos));
                                if value.is_html() {
                                    summary.html.insert(sheet.id);
                                }
                            }
                        };
                    }
                    None => {
                        summary
                            .cell_sheets_modified
                            .insert(CellSheetsModified::new(sheet.id, pos));
                    }
                };
            }
        }

        // updates summary.thumbnail_dirty flag
        let sheet = grid_controller.grid.sheet_from_id(cell_ref.sheet);
        if let Some(pos) = sheet.cell_ref_to_pos(cell_ref) {
            if let Some(updated_code_cell_value) = updated_code_cell_value.as_ref() {
                if let Some(output) = updated_code_cell_value.output.as_ref() {
                    match output.result.output_value() {
                        Some(output_value) => {
                            match output_value {
                                Value::Array(array) => {
                                    summary.generate_thumbnail = summary.generate_thumbnail
                                        || grid_controller.thumbnail_dirty_rect(
                                            cell_ref.sheet,
                                            Rect::new_span(
                                                Pos { x: pos.x, y: pos.y },
                                                Pos {
                                                    x: pos.x + array.width() as i64,
                                                    y: pos.y + array.height() as i64,
                                                },
                                            ),
                                        );
                                }
                                Value::Single(_) => {
                                    summary.generate_thumbnail = summary.generate_thumbnail
                                        || grid_controller.thumbnail_dirty_pos(sheet.id, pos);
                                }
                            };
                        }
                        None => {
                            summary.generate_thumbnail = summary.generate_thumbnail
                                || grid_controller.thumbnail_dirty_pos(sheet.id, pos);
                        }
                    }
                }
            }
        }

        let sheet = grid_controller.grid.sheet_mut_from_id(cell_ref.sheet);
        fetch_code_cell_difference(
            sheet,
            pos,
            old_code_cell_value.clone(),
            updated_code_cell_value,
            summary,
            cells_to_compute,
        );

        reverse_operations.push(Operation::SetCellCode {
            cell_ref,
            code_cell_value: old_code_cell_value,
        });
        summary.code_cells_modified.insert(sheet.id);
    }
    success
}

/// Fetches the difference between the old and new code cell values and updates the UI
pub fn fetch_code_cell_difference(
    sheet: &mut Sheet,
    pos: Pos,
    old_code_cell_value: Option<CodeCellValue>,
    new_code_cell_value: Option<CodeCellValue>,
    summary: &mut TransactionSummary,
    cells_to_compute: &mut IndexSet<CellRef>,
) {
    let (old_w, old_h) = if let Some(old_code_cell_value) = old_code_cell_value {
        let size = old_code_cell_value.output_size();
        (size.w.get(), size.h.get())
    } else {
        (0, 0)
    };
    let (new_w, new_h) = if let Some(new_code_cell_value) = new_code_cell_value {
        let size = new_code_cell_value.output_size();
        (size.w.get(), size.h.get())
    } else {
        (0, 0)
    };

    if old_w > new_w {
        for x in new_w..old_w {
            let (_, column) = sheet.get_or_create_column(pos.x + x as i64);
            let column_id = column.id;

            // todo: temporary way of cleaning up deleted spills. There needs to be a spill checker here....
            column.spills.remove_range(Range {
                start: pos.y,
                end: pos.y + new_h as i64 + 1,
            });
            for y in 0..new_h {
                let row_id = sheet.get_or_create_row(pos.y + y as i64).id;
                let pos = Pos {
                    x: pos.x + x as i64,
                    y: pos.y + y as i64,
                };
                summary
                    .cell_sheets_modified
                    .insert(CellSheetsModified::new(sheet.id, pos));
                cells_to_compute.insert(CellRef {
                    sheet: sheet.id,
                    column: column_id,
                    row: row_id,
                });
            }
        }
    }
    if old_h > new_h {
        for x in 0..old_w {
            let (_, column) = sheet.get_or_create_column(pos.x + x as i64);
            let column_id = column.id;

            // todo: temporary way of cleaning up deleted spills. There needs to be a spill checker here....
            column.spills.remove_range(Range {
                start: pos.y + new_h as i64,
                end: pos.y + old_h as i64 + 1,
            });
            for y in new_h..old_h {
                let row_id = sheet.get_or_create_row(pos.y + y as i64).id;
                let pos = Pos {
                    x: pos.x + x as i64,
                    y: pos.y + y as i64,
                };
                summary
                    .cell_sheets_modified
                    .insert(CellSheetsModified::new(sheet.id, pos));
                cells_to_compute.insert(CellRef {
                    sheet: sheet.id,
                    column: column_id,
                    row: row_id,
                });
            }
        }
    }
}

#[cfg(test)]
mod test {
    use indexmap::IndexSet;

    use crate::{
        controller::{
            transaction_summary::TransactionSummary,
            update_code_cell_value::fetch_code_cell_difference,
        },
        grid::{CodeCellLanguage, CodeCellRunOutput, CodeCellValue, Sheet},
        Array, ArraySize, SheetPos, Value,
    };

    #[test]
    fn test_fetch_code_cell_difference() {
        let mut sheet = Sheet::test();

        let old = Some(CodeCellValue {
            language: CodeCellLanguage::Python,
            code_string: "print(1)".to_string(),
            formatted_code_string: None,
            last_modified: String::from(""),
            output: Some(CodeCellRunOutput {
                std_out: None,
                std_err: None,
                result: crate::grid::CodeCellRunResult::Ok {
                    output_value: Value::Array(Array::new_empty(
                        ArraySize::try_from((2, 3)).expect("failed to create array"),
                    )),
                    cells_accessed: Vec::new(),
                },
            }),
        });
        let new_smaller = Some(CodeCellValue {
            language: CodeCellLanguage::Python,
            code_string: "print(1)".to_string(),
            formatted_code_string: None,
            last_modified: String::from(""),
            output: Some(CodeCellRunOutput {
                std_out: None,
                std_err: None,
                result: crate::grid::CodeCellRunResult::Ok {
                    output_value: Value::Array(Array::new_empty(
                        ArraySize::try_from((1, 2)).expect("failed to create array"),
                    )),
                    cells_accessed: Vec::new(),
                },
            }),
        });

        let sheet_pos = SheetPos {
            x: 0,
            y: 0,
            sheet_id: sheet.id,
        };

        let mut summary = TransactionSummary::default();

        let mut cells_to_compute = IndexSet::new();

        fetch_code_cell_difference(
            &mut sheet,
            sheet_pos.into(),
            old.clone(),
            new_smaller,
            &mut summary,
            &mut cells_to_compute,
        );
        assert_eq!(summary.cell_sheets_modified.len(), 1);

        summary.clear();

        let new_larger = Some(CodeCellValue {
            language: CodeCellLanguage::Python,
            code_string: "print(1)".to_string(),
            formatted_code_string: None,
            last_modified: String::from(""),
            output: Some(CodeCellRunOutput {
                std_out: None,
                std_err: None,
                result: crate::grid::CodeCellRunResult::Ok {
                    output_value: Value::Array(Array::new_empty(
                        ArraySize::try_from((5, 6)).expect("failed to create array"),
                    )),
                    cells_accessed: Vec::new(),
                },
            }),
        });

        super::fetch_code_cell_difference(
            &mut sheet,
            sheet_pos.into(),
            old,
            new_larger,
            &mut summary,
            &mut cells_to_compute,
        );
        assert_eq!(summary.cell_sheets_modified.len(), 0);
    }
}
