// Handles all spill checking for the sheet

use crate::{
    controller::{
        active_transactions::pending_transaction::PendingTransaction,
        operations::operation::Operation, GridController,
    },
    grid::SheetId,
    Rect, SheetRect,
};

impl GridController {
    /// Changes the spill error for a code_cell and adds necessary operations
    fn change_spill(
        &mut self,
        transaction: &mut PendingTransaction,
        sheet_id: SheetId,
        index: usize,
        set_spill_error: bool,
    ) {
        // change the spill for the first code_cell and then iterate the later code_cells.
        if let Some(sheet) = self.grid.try_sheet_mut(sheet_id) {
            if let Some((pos, run)) = sheet.code_runs.get_index_mut(index) {
                let sheet_pos = pos.to_sheet_pos(sheet.id);
                transaction.reverse_operations.insert(
                    0,
                    Operation::SetCodeRun {
                        sheet_pos,
                        code_run: Some(run.clone()),
                    },
                );
                run.spill_error = set_spill_error;
                transaction.forward_operations.push(Operation::SetCodeRun {
                    sheet_pos,
                    code_run: Some(run.clone()),
                });
            }
            self.check_all_spills(transaction, sheet_id, index + 1);
        }
    }

    /// Checks for spills caused by a change in a sheet_rect.
    /// Use only when the changed output range is known (otherwise call check_all_spills).
    /// Will automatically call check_all_spills if a code_cell's spill error has changed.
    pub fn check_spills(&mut self, transaction: &mut PendingTransaction, sheet_rect: &SheetRect) {
        let sheet_id = sheet_rect.sheet_id;
        // find the first code cell that has a change in its spill_error
        let result = match self.grid.try_sheet_mut(sheet_id) {
            None => None,
            Some(sheet) => {
                sheet
                    .code_runs
                    .iter()
                    .enumerate()
                    .find_map(|(index, (pos, code_run))| {
                        let output = code_run.output_sheet_rect(pos.to_sheet_pos(sheet_id), true);

                        // initially only check the code_cell if the output intersects the sheet_rect
                        if output.intersects(*sheet_rect) {
                            let rect: Rect = output.into();

                            // then do the more expensive checks to see if there is a spill error
                            if sheet.has_cell_value_in_rect(&rect, Some(*pos))
                                || sheet.has_code_cell_anchor_in_rect(&rect, *pos)
                                || sheet.has_code_cell_in_rect(&rect, *pos)
                            {
                                // if spill error has not been set, then set it and start the more expensive checks for all later code_cells.
                                if !code_run.spill_error {
                                    Some((index, true))
                                } else {
                                    None
                                }
                            } else if code_run.spill_error {
                                // release the code_cell's spill error, then start the more expensive checks for all later code_cells.
                                Some((index, false))
                            } else {
                                None
                            }
                        } else {
                            None
                        }
                    })
            }
        };
        if let Some((index, set_spill_error)) = result {
            self.change_spill(transaction, sheet_id, index, set_spill_error);
        }
    }

    /// Checks all code_cells for changes in spill_errors.
    /// Will iterate through remaining code_cells after a change until it touches every code_cell.
    ///
    /// * `start` - the index of the first code_cell to check (we don't need to check earlier code_cells when iterating)
    pub fn check_all_spills(
        &mut self,
        transaction: &mut PendingTransaction,
        sheet_id: SheetId,
        start: usize,
    ) {
        if let Some(sheet) = self.grid.try_sheet_mut(sheet_id) {
            let result = sheet.code_runs.iter().skip(start).enumerate().find_map(
                |(index, (pos, code_cell))| {
                    let output = code_cell.output_sheet_rect(pos.to_sheet_pos(sheet.id), true);
                    let rect: Rect = output.into();
                    if sheet.has_cell_value_in_rect(&rect, Some(*pos))
                        || sheet.has_code_cell_anchor_in_rect(&rect, *pos)
                        || sheet.has_code_cell_in_rect(&rect, *pos)
                    {
                        if !code_cell.spill_error {
                            Some((index, true))
                        } else {
                            None
                        }
                    } else if code_cell.spill_error {
                        Some((index, false))
                    } else {
                        None
                    }
                },
            );
            if let Some((index, set_spill_error)) = result {
                self.change_spill(transaction, sheet_id, index, set_spill_error);
                self.check_all_spills(transaction, sheet_id, index + 1);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        controller::{
            active_transactions::pending_transaction::PendingTransaction, GridController,
        },
        CellValue, Pos, SheetPos,
    };

    #[test]
    fn test_check_spills() {
        let mut gc = GridController::new();
        let mut transaction = PendingTransaction::default();

        let sheet_id = gc.sheet_ids()[0];
        let sheet = gc.grid.try_sheet_mut(sheet_id).unwrap();
        sheet.set_cell_value(Pos { x: 0, y: 0 }, CellValue::Number(1.into()));
        sheet.set_cell_value(Pos { x: 0, y: 1 }, CellValue::Number(2.into()));
        gc.set_code_cell(
            SheetPos {
                x: 1,
                y: 0,
                sheet_id,
            },
            crate::grid::CodeCellLanguage::Formula,
            "A0:A1".to_string(),
            None,
        );

        let sheet = gc.grid.try_sheet_mut(sheet_id).unwrap();

        // manually set a cell value and see if spill is changed
        sheet.set_cell_value(Pos { x: 1, y: 1 }, CellValue::Number(3.into()));
        let sheet_rect = SheetPos {
            x: 1,
            y: 1,
            sheet_id,
        }
        .into();

        let sheet = gc.grid.try_sheet(sheet_id).unwrap();
        assert!(!sheet.code_runs[0].spill_error);

        gc.check_spills(&mut transaction, &sheet_rect);

        let sheet = gc.grid.try_sheet(sheet_id).unwrap();
        assert!(sheet.code_runs[0].spill_error);
    }

    #[test]
    fn test_check_all_spills() {
        let mut gc = GridController::new();
        let mut transaction = PendingTransaction::default();

        let sheet_id = gc.sheet_ids()[0];
        let sheet = gc.grid.try_sheet_mut(sheet_id).unwrap();
        sheet.set_cell_value(Pos { x: 0, y: 0 }, CellValue::Number(1.into()));
        sheet.set_cell_value(Pos { x: 0, y: 1 }, CellValue::Number(2.into()));
        gc.set_code_cell(
            SheetPos {
                x: 1,
                y: 0,
                sheet_id,
            },
            crate::grid::CodeCellLanguage::Formula,
            "A0:A1".to_string(),
            None,
        );

        let sheet = gc.grid.try_sheet_mut(sheet_id).unwrap();

        // manually set a cell value and see if spill is changed
        sheet.set_cell_value(Pos { x: 1, y: 1 }, CellValue::Number(3.into()));

        let sheet = gc.grid.try_sheet(sheet_id).unwrap();
        assert!(!sheet.code_runs[0].spill_error);

        gc.check_all_spills(&mut transaction, sheet_id, 0);

        let sheet = gc.grid.try_sheet(sheet_id).unwrap();
        assert!(sheet.code_runs[0].spill_error);
    }
}
