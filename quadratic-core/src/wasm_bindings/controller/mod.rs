use super::*;
use crate::grid::js_types::*;
use crate::wasm_bindings::controller::sheet_info::SheetInfo;
use std::str::FromStr;

pub mod auto_complete;
pub mod borders;
pub mod bounds;
pub mod cells;
pub mod clipboard;
pub mod code;
pub mod export;
pub mod formatting;
pub mod import;
pub mod render;
pub mod search;
pub mod sheet_info;
pub mod sheet_offsets;
pub mod sheets;
pub mod summarize;
pub mod transactions;
pub mod worker;

#[wasm_bindgen]
impl GridController {
    /// Imports a [`GridController`] from a JSON string.
    #[wasm_bindgen(js_name = "newFromFile")]
    pub fn js_new_from_file(
        file: &str,
        last_sequence_num: u32,
        initialize: bool,
    ) -> Result<GridController, JsValue> {
        if let Ok(file) = file::import(file).map_err(|e| e.to_string()) {
            let grid = GridController::from_grid(file, last_sequence_num as u64);
            if initialize {
                let mut html = vec![];
                let sheets_info = grid
                    .sheet_ids()
                    .iter()
                    .filter_map(|sheet_id| {
                        grid.try_sheet(*sheet_id).map(|sheet| {
                            html.extend(sheet.get_html_output());
                            SheetInfo::from(sheet)
                        })
                    })
                    .collect::<Vec<SheetInfo>>();
                if let Ok(sheets_info) = serde_json::to_string(&sheets_info) {
                    crate::wasm_bindings::js::jsSheetInfo(sheets_info);
                }
                if !html.is_empty() {
                    if let Ok(html) = serde_json::to_string(&html) {
                        crate::wasm_bindings::js::jsHtmlOutput(html);
                    }
                }
                grid.sheet_ids().iter().for_each(|sheet_id| {
                    let fills = grid.sheet_fills(*sheet_id);
                    if let Ok(fills) = serde_json::to_string(&fills) {
                        crate::wasm_bindings::js::jsSheetFills(sheet_id.to_string(), fills);
                    }
                    if let Some(sheet) = grid.try_sheet(*sheet_id) {
                        let borders = sheet.render_borders();
                        if let Ok(borders) = serde_json::to_string(&borders) {
                            crate::wasm_bindings::js::jsSheetBorders(sheet_id.to_string(), borders);
                        }
                        let code = sheet.get_all_render_code_cells();
                        if !code.is_empty() {
                            if let Ok(code) = serde_json::to_string(&code) {
                                crate::wasm_bindings::js::jsSheetCodeCellRender(
                                    sheet_id.to_string(),
                                    code,
                                );
                            }
                        }
                    }
                });
            }
            Ok(grid)
        } else {
            Err(JsValue::from_str("Failed to import grid"))
        }
    }

    #[wasm_bindgen(js_name = "test")]
    pub fn js_test() -> GridController {
        GridController::test()
    }

    /// Exports a [`GridController`] to a file. Returns a `String`.
    #[wasm_bindgen(js_name = "exportToFile")]
    pub fn js_export_to_file(&mut self) -> Result<String, JsValue> {
        Ok(file::export(self.grid_mut()).map_err(|e| e.to_string())?)
    }

    /// Exports a [`string`]
    #[wasm_bindgen(js_name = "getVersion")]
    pub fn js_file_version(&self) -> String {
        file::CURRENT_VERSION.into()
    }

    /// Returns whether there is a transaction to undo.
    #[wasm_bindgen(js_name = "hasUndo")]
    pub fn js_has_undo(&self) -> bool {
        self.has_undo()
    }

    /// Returns whether there is a transaction to redo.
    #[wasm_bindgen(js_name = "hasRedo")]
    pub fn js_has_redo(&self) -> bool {
        self.has_redo()
    }

    /// Undoes one transaction. Returns a [`TransactionSummary`], or `null` if
    /// there was nothing to undo.
    #[wasm_bindgen(js_name = "undo")]
    pub fn js_undo(&mut self, cursor: Option<String>) -> Result<JsValue, JsValue> {
        Ok(serde_wasm_bindgen::to_value(&self.undo(cursor))?)
    }
    /// Redoes one transaction. Returns a [`TransactionSummary`], or `null` if
    /// there was nothing to redo.
    #[wasm_bindgen(js_name = "redo")]
    pub fn js_redo(&mut self, cursor: Option<String>) -> Result<JsValue, JsValue> {
        Ok(serde_wasm_bindgen::to_value(&self.redo(cursor))?)
    }
}
