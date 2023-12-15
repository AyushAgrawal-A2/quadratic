use crate::{
    controller::GridController,
    formulas::{parse_formula, Ctx},
    grid::{CodeCellLanguage, CodeCellRunOutput, CodeCellRunResult, CodeCellValue},
    SheetPos,
};

impl GridController {
    pub(super) fn eval_formula(
        &mut self,
        code_string: String,
        language: CodeCellLanguage,
        sheet_pos: SheetPos,
    ) {
        let mut ctx = Ctx::new(self.grid(), sheet_pos);
        match parse_formula(&code_string, sheet_pos.into()) {
            Ok(parsed) => {
                match parsed.eval(&mut ctx) {
                    Ok(value) => {
                        self.cells_accessed = ctx.cells_accessed;
                        let updated_code_cell_value = CodeCellValue {
                            language,
                            code_string,
                            formatted_code_string: None,
                            output: Some(CodeCellRunOutput {
                                std_out: None,
                                std_err: None,
                                result: CodeCellRunResult::Ok {
                                    output_value: value,
                                    cells_accessed: self
                                        .cells_accessed
                                        .clone()
                                        .into_iter()
                                        .collect(),
                                },
                                spill: false,
                            }),
                            // todo
                            last_modified: String::new(),
                        };
                        if self.update_code_cell_value(sheet_pos, Some(updated_code_cell_value)) {
                            // clears cells_accessed
                            self.cells_accessed.clear();
                        }
                    }
                    Err(error) => {
                        let msg = error.msg.to_string();
                        let line_number = error.span.map(|span| span.start as i64);
                        self.code_cell_sheet_error(
                            msg,
                            // todo: span should be multiline
                            line_number,
                        );
                    }
                }
            }
            Err(e) => {
                let msg = e.to_string();
                self.code_cell_sheet_error(msg, None);
            }
        }
    }
}
