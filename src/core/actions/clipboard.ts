import { Coordinate } from '../gridGL/types/size';
import { Cell, CellFormat } from '../gridDB/gridTypes';
import { SheetController } from '../transaction/sheetController';
import { updateCellAndDCells } from './updateCellAndDCells';
import { DeleteCells } from '../gridDB/Cells/DeleteCells';
import { CellAndFormat } from '../gridDB/GridSparse';

const pasteFromTextHtml = async (sheet_controller: SheetController, pasteToCell: Coordinate) => {
  try {
    const clipboard_data = await navigator.clipboard.read();
    // Attempt to read Quadratic data from clipboard
    for (let i = 0; i < clipboard_data.length; i++) {
      const item = clipboard_data[i];
      const item_blob = await item.getType('text/html');
      let item_text = await item_blob.text();

      // strip html tags
      item_text = item_text.replace(/(<([^>]+)>)/gi, '');

      // parse json from text
      let json = JSON.parse(item_text);

      if (json.type === 'quadratic/clipboard') {
        const x_offset = pasteToCell.x - json.cell0.x;
        const y_offset = pasteToCell.y - json.cell0.y;

        let cells_to_update: Cell[] = [];
        let formats_to_update: CellFormat[] = [];
        json.copiedCells.forEach((cell_and_format: CellAndFormat) => {
          const cell = cell_and_format.cell;
          const format = cell_and_format.format;
          if (cell)
            cells_to_update.push({
              ...cell, // take old cell
              x: cell.x + x_offset, // transpose it to new location
              y: cell.y + y_offset,
              last_modified: new Date().toISOString(), // update last_modified
            });
          if (format && format.x !== undefined && format.y !== undefined)
            formats_to_update.push({
              ...format, // take old format
              x: format.x + x_offset, // transpose it to new location
              y: format.y + y_offset,
            });
        });

        // Start Transaction
        sheet_controller.start_transaction();

        // update cells
        await updateCellAndDCells({
          starting_cells: cells_to_update,
          sheetController: sheet_controller,
          create_transaction: false,
        });

        // update formats
        formats_to_update.forEach((format) => {
          if (format.x !== undefined && format.y !== undefined)
            sheet_controller.execute_statement({
              type: 'SET_CELL_FORMAT',
              data: {
                position: [format.x, format.y],
                value: format,
              },
            });
        });

        sheet_controller.end_transaction();

        return true; // successful don't continue
      }
    }
    return false; // unsuccessful
  } catch {
    return false; // unsuccessful
  }
};

const pasteFromText = async (sheet_controller: SheetController, pasteToCell: Coordinate) => {
  try {
    // attempt to read text from clipboard
    const clipboard_text = await navigator.clipboard.readText();
    let cell_x: number = pasteToCell.x;
    let cell_y: number = pasteToCell.y;

    // build api payload
    let cells_to_write: Cell[] = [];
    let cells_to_delete: Coordinate[] = [];

    let str_rows: string[] = clipboard_text.split('\n');

    // for each copied row
    str_rows.forEach((str_row) => {
      let str_cells: string[] = str_row.split('\t');

      // for each copied cell
      str_cells.forEach((str_cell) => {
        // update or clear cell
        if (str_cell !== '') {
          cells_to_write.push({
            x: cell_x,
            y: cell_y,
            type: 'TEXT',
            value: str_cell,
            last_modified: new Date().toISOString(),
          });
        } else {
          cells_to_delete.push({
            x: cell_x,
            y: cell_y,
          });
        }

        // move to next cell
        cell_x += 1;
      });

      // move to next row and return
      cell_y += 1;
      cell_x = pasteToCell.x;
    });

    // TODO ALSO BE ABLE TO PASS CELLS TO DELETE TO updatecellandcells

    // bulk update and delete cells
    await updateCellAndDCells({
      starting_cells: cells_to_write,
      sheetController: sheet_controller,
    });

    // cells_to_delete

    return true; // unsuccessful
  } catch {
    return false; // unsuccessful
  }
};

export const pasteFromClipboard = async (sheet_controller: SheetController, pasteToCell: Coordinate) => {
  if (navigator.clipboard && window.ClipboardItem) {
    let success = false;

    // attempt to read Quadratic data from clipboard
    success = await pasteFromTextHtml(sheet_controller, pasteToCell);
    if (success) return;

    // attempt to read tabular text from clipboard
    success = await pasteFromText(sheet_controller, pasteToCell);
    if (success) return;
  }
};

export const copyToClipboard = async (sheet_controller: SheetController, cell0: Coordinate, cell1: Coordinate) => {
  // write selected cells to clipboard

  const cWidth = Math.abs(cell1.x - cell0.x) + 1;
  const cHeight = Math.abs(cell1.y - cell0.y) + 1;

  let clipboardString = '';
  let copiedCells: CellAndFormat[] = [];

  for (let offset_y = 0; offset_y < cHeight; offset_y++) {
    if (offset_y > 0) {
      clipboardString += '\n';
    }

    for (let offset_x = 0; offset_x < cWidth; offset_x++) {
      let cell_x = cell0.x + offset_x;
      let cell_y = cell0.y + offset_y;

      if (offset_x > 0) {
        clipboardString += '\t';
      }

      const cell_and_format = sheet_controller.sheet.getCellAndFormatCopy(cell_x, cell_y);

      if (cell_and_format) {
        clipboardString += cell_and_format?.cell?.value || '';
        copiedCells.push({ ...cell_and_format });
      }
    }
  }

  const quadraticString = JSON.stringify({
    type: 'quadratic/clipboard',
    copiedCells,
    cell0,
    cell1,
  });

  // https://github.com/tldraw/tldraw/blob/a85e80961dd6f99ccc717749993e10fa5066bc4d/packages/tldraw/src/state/TldrawApp.ts#L2189
  if (navigator.clipboard && window.ClipboardItem) {
    // browser support clipboard apinavigator.clipboard
    navigator.clipboard.write([
      new ClipboardItem({
        //@ts-ignore
        'text/html': new Blob([quadraticString], { type: 'text/html' }),
        //@ts-ignore
        'text/plain': new Blob([clipboardString], { type: 'text/plain' }),
      }),
    ]);
  } else {
    // fallback to textarea
    const textarea = document.createElement('textarea');
    textarea.value = clipboardString;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
};

export const cutToClipboard = async (sheet_controller: SheetController, cell0: Coordinate, cell1: Coordinate) => {
  // copy selected cells to clipboard
  await copyToClipboard(sheet_controller, cell0, cell1);

  // delete selected cells
  await DeleteCells({
    x0: cell0.x,
    y0: cell0.y,
    x1: cell1.x,
    y1: cell1.y,
    sheetController: sheet_controller,
    app: sheet_controller.app,
  });
};
