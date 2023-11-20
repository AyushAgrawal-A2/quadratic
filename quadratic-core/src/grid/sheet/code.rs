use std::{collections::HashSet, ops::Range};

use super::Sheet;
use crate::{
    grid::{CellRef, CodeCellValue},
    CellValue, Pos, Rect, Value,
};

impl Sheet {
    /// Sets or deletes a code cell value and populates spills.
    pub fn set_code_cell_value(
        &mut self,
        pos: Pos,
        code_cell: Option<CodeCellValue>,
    ) -> Option<CodeCellValue> {
        let cell_ref = self.get_or_create_cell_ref(pos);
        let old = self.code_cells.remove(&cell_ref);
        if let Some(code_cell) = code_cell {
            if let Some(output) = code_cell.output.clone() {
                match output.output_value() {
                    Some(output_value) => match output_value {
                        Value::Single(_) => {
                            let (_, column) = self.get_or_create_column(pos.x);
                            column.spills.set(pos.y, Some(cell_ref));
                        }
                        Value::Array(array) => {
                            let start = pos.x;
                            let end = start + array.width() as i64;
                            let range = Range {
                                start: pos.y,
                                end: pos.y + array.height() as i64,
                            };
                            for x in start..end {
                                let (_, column) = self.get_or_create_column(x);
                                column.spills.set_range(range.clone(), cell_ref);
                            }
                        }
                    },
                    None => {
                        let (_, column) = self.get_or_create_column(pos.x);
                        column.spills.set(pos.y, Some(cell_ref));
                    }
                }
            }
            self.code_cells.insert(cell_ref, code_cell);
        }
        old
    }

    /// Returns a code cell value.
    pub fn get_code_cell(&self, pos: Pos) -> Option<&CodeCellValue> {
        self.code_cells.get(&self.try_get_cell_ref(pos)?)
    }

    /// Returns a code cell value.
    pub fn get_code_cell_from_ref(&self, cell_ref: CellRef) -> Option<&CodeCellValue> {
        self.code_cells.get(&cell_ref)
    }

    pub fn get_code_cell_value(&self, pos: Pos) -> Option<CellValue> {
        let column = self.get_column(pos.x)?;
        let block = column.spills.get(pos.y)?;
        let code_cell_pos = self.cell_ref_to_pos(block)?;
        let code_cell = self.code_cells.get(&block)?;
        code_cell.get_output_value(
            (pos.x - code_cell_pos.x) as u32,
            (pos.y - code_cell_pos.y) as u32,
        )
    }

    /// Returns an iterator over all locations containing code cells that may
    /// spill into `region`.
    pub fn iter_code_cells_locations_in_region(
        &self,
        region: Rect,
    ) -> impl Iterator<Item = CellRef> {
        // Scan spilled cells to find code cells. TODO: this won't work for
        // unspilled code cells
        let code_cell_refs: HashSet<CellRef> = self
            .columns
            .range(region.x_range())
            .flat_map(|(_x, column)| {
                column
                    .spills
                    .blocks_covering_range(region.y_range())
                    .map(|block| block.content().value)
            })
            .collect();

        code_cell_refs.into_iter()
    }

    pub fn iter_code_cells_locations(&self) -> impl '_ + Iterator<Item = CellRef> {
        self.code_cells.keys().copied()
    }

    /// returns the output_size for a html-like cell; returns 0, 0 if not set
    pub fn html_output_size(&self, pos: Pos) -> (i64, i64) {
        if let Some(column) = self.get_column(pos.x) {
            if let Some(output_size) = column.output_size.get(pos.y) {
                return (output_size.w, output_size.h);
            }
        }
        (0, 0)
    }
}

#[cfg(test)]
mod test {
    use crate::{controller::GridController, Rect};

    #[test]
    fn test_html_output_size() {
        use crate::Pos;

        let mut gc = GridController::new();
        let sheet_id = gc.sheet_ids()[0];
        gc.set_cell_output_size(
            sheet_id,
            Rect::single_pos(Pos { x: 0, y: 0 }),
            Some(crate::grid::OutputSize { w: 10, h: 20 }),
            None,
        );

        let sheet = gc.sheet(sheet_id);
        assert_eq!(sheet.html_output_size(Pos { x: 0, y: 0 }), (10, 20));
        assert_eq!(sheet.html_output_size(Pos { x: 1, y: 1 }), (0, 0));
    }
}
