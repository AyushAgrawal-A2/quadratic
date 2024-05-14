use std::collections::VecDeque;

use crate::controller::{
    active_transactions::pending_transaction::PendingTransaction, operations::operation::Operation,
    user_actions::clipboard::PasteSpecial, GridController,
};

impl GridController {
    pub fn execute_move_cells(&mut self, transaction: &mut PendingTransaction, op: Operation) {
        if let Operation::MoveCells { source, dest } = op {
            // we replace the MoveCells operation with a series of cut/paste
            // operations so we don't have to reimplement it. There's definitely
            // a more efficient way to do this. todo: when rewriting the data
            // store, we should implement higher-level functions that would more
            // easily implement cut/paste/move without resorting to this
            // approach.
            let mut operations = VecDeque::new();
            let (cut_ops, _, html) = self.cut_to_clipboard_operations(source);
            operations.extend(cut_ops);
            if let Ok(paste_ops) = self.paste_html_operations(dest, html, PasteSpecial::None) {
                operations.extend(paste_ops);
            }
            operations.extend(transaction.operations.drain(..));
            transaction.operations = operations;
        }
    }
}
