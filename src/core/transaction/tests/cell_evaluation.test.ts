import { SheetController } from '../sheetController';
import { Cell } from '../../gridDB/gridTypes';
import { setupPython } from '../../computations/python/loadPython';
import { updateCellAndDCells } from '../../actions/updateCellAndDCells';
import init from 'quadratic-core';

// Setup Pyodide before tests
let pyodide: any;
beforeAll(async () => {
  const { loadPyodide } = require('pyodide');
  pyodide = await loadPyodide();
  await setupPython(pyodide);
  await init();
});

test('SheetController - code run correctly', async () => {
  const sc = new SheetController();

  const cell = {
    x: 54,
    y: 54,
    value: '',
    type: 'PYTHON',
    python_code: "print('hello')\n'world'",
    last_modified: '2023-01-19T19:12:21.745Z',
  } as Cell;

  await updateCellAndDCells({ starting_cells: [cell], sheetController: sc, pyodide });

  const cell_after = sc.sheet.grid.getCell(54, 54);

  expect(cell_after?.value).toBe('world');
  expect(cell_after?.python_code).toBe("print('hello')\n'world'\n");
  expect(cell_after?.python_output).toBe('hello\n');
  expect(cell_after?.last_modified).toBeDefined();
  expect(cell_after?.type).toBe('PYTHON');
});

test('SheetController - array output undo redo', async () => {
  const sc = new SheetController();

  const cell = {
    x: 0,
    y: 0,
    value: '',
    type: 'PYTHON',
    python_code: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]',
    last_modified: '2023-01-19T19:12:21.745Z',
  } as Cell;

  await updateCellAndDCells({ starting_cells: [cell], sheetController: sc, pyodide });

  const after_code_run_cells = sc.sheet.grid.getNakedCells(0, 0, 0, 10);
  expect(after_code_run_cells[0]?.value).toBe('1');
  expect(after_code_run_cells[0]?.python_code).toBe('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n');
  expect(after_code_run_cells[0]?.python_output).toBe('');
  expect(after_code_run_cells[0]?.last_modified).toBeDefined();
  expect(after_code_run_cells[0]?.type).toBe('PYTHON');
  expect(after_code_run_cells[0]?.array_cells).toBeDefined();
  after_code_run_cells.forEach((cell, index) => {
    expect(cell.value).toEqual((index + 1).toString());
    if (index === 0) return;

    expect(cell.type).toEqual('COMPUTED');
  });

  sc.undo();

  const after_undo_cells = sc.sheet.grid.getNakedCells(0, 0, 0, 10);

  expect(after_undo_cells.length).toBe(0);

  sc.redo();

  const after_redo_cells = sc.sheet.grid.getNakedCells(0, 0, 0, 10);
  expect(after_redo_cells.length).toBe(10);
  expect(after_redo_cells[0]?.value).toBe('1');
  expect(after_redo_cells[0]?.python_code).toBe('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n');
  expect(after_redo_cells[0]?.python_output).toBe('');
  expect(after_redo_cells[0]?.last_modified).toBeDefined();
  expect(after_redo_cells[0]?.type).toBe('PYTHON');
  expect(after_redo_cells[0]?.array_cells).toBeDefined();
  after_redo_cells.forEach((cell, index) => {
    expect(cell.value).toEqual((index + 1).toString());
    if (index === 0) return;

    expect(cell.type).toEqual('COMPUTED');
  });
});

test('SheetController - array output length change', async () => {
  const sc = new SheetController();

  const cell = {
    x: 0,
    y: 0,
    value: '',
    type: 'PYTHON',
    python_code: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]',
    last_modified: '2023-01-19T19:12:21.745Z',
  } as Cell;

  await updateCellAndDCells({ starting_cells: [cell], sheetController: sc, pyodide });

  const after_code_run_cells = sc.sheet.grid.getNakedCells(0, 0, 0, 20);
  expect(after_code_run_cells[0]?.value).toBe('1');
  expect(after_code_run_cells[0]?.python_code).toBe('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n');
  expect(after_code_run_cells[0]?.python_output).toBe('');
  expect(after_code_run_cells[0]?.last_modified).toBeDefined();
  expect(after_code_run_cells[0]?.type).toBe('PYTHON');
  expect(after_code_run_cells[0]?.array_cells?.length).toBe(10);
  expect(after_code_run_cells.length).toBe(10);
  after_code_run_cells.forEach((cell, index) => {
    expect(cell.value).toEqual((index + 1).toString());
    if (index === 0) return;
    expect(cell.type).toEqual('COMPUTED');
  });

  // SET TO A NEW FORMULA

  const cell_update_1 = {
    x: 0,
    y: 0,
    value: '',
    type: 'PYTHON',
    python_code: '["1new", "2new", "3new", "4new", "5new"]',
    last_modified: '2023-01-19T19:12:21.745Z',
  } as Cell;

  await updateCellAndDCells({ starting_cells: [cell_update_1], sheetController: sc, pyodide });

  const after_update_1 = sc.sheet.grid.getNakedCells(0, 0, 0, 20);
  expect(after_update_1.length).toBe(5);
  expect(sc.sheet.grid.getNakedCells(0, 5, 0, 20).length).toBe(0); // check that the old cells are gone
  expect(after_update_1[0]?.value).toBe('1new'); // verify code cell is set properly
  expect(after_update_1[0]?.python_code).toBe('["1new", "2new", "3new", "4new", "5new"]\n');
  expect(after_update_1[0]?.python_output).toBe('');
  expect(after_update_1[0]?.last_modified).toBeDefined();
  expect(after_update_1[0]?.type).toBe('PYTHON');
  expect(after_update_1[0]?.array_cells?.length).toBe(5);
  after_update_1.forEach((cell, index) => {
    expect(cell.value).toEqual((index + 1).toString() + 'new');
    if (index === 0) return;
    expect(cell.type).toEqual('COMPUTED');
  });

  // UNDO
  sc.undo();

  const after_undo_1 = sc.sheet.grid.getNakedCells(0, 0, 0, 20);
  expect(after_undo_1[0]?.value).toBe('1');
  expect(after_undo_1[0]?.python_code).toBe('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n');
  expect(after_undo_1[0]?.python_output).toBe('');
  expect(after_undo_1[0]?.last_modified).toBeDefined();
  expect(after_undo_1[0]?.type).toBe('PYTHON');
  expect(after_undo_1[0]?.array_cells?.length).toBe(10);
  expect(after_undo_1.length).toBe(10);
  after_undo_1.forEach((cell, index) => {
    expect(cell.value).toEqual((index + 1).toString());
    if (index === 0) return;
    expect(cell.type).toEqual('COMPUTED');
  });

  // UNDO

  sc.undo();
  expect(sc.sheet.grid.getNakedCells(0, 0, 0, 20).length).toBe(0);

  // REDO

  sc.redo();

  const after_redo_1 = sc.sheet.grid.getNakedCells(0, 0, 0, 20);
  expect(after_redo_1[0]?.value).toBe('1');
  expect(after_redo_1[0]?.python_code).toBe('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n');
  expect(after_redo_1[0]?.python_output).toBe('');
  expect(after_redo_1[0]?.last_modified).toBeDefined();
  expect(after_redo_1[0]?.type).toBe('PYTHON');
  expect(after_redo_1[0]?.array_cells?.length).toBe(10);
  expect(after_redo_1.length).toBe(10);
  after_redo_1.forEach((cell, index) => {
    expect(cell.value).toEqual((index + 1).toString());
    if (index === 0) return;
    expect(cell.type).toEqual('COMPUTED');
  });

  // REDO

  sc.redo();

  const after_redo_2 = sc.sheet.grid.getNakedCells(0, 0, 0, 20);
  expect(after_redo_2.length).toBe(5);
  expect(sc.sheet.grid.getNakedCells(0, 5, 0, 20).length).toBe(0); // check that the old cells are gone
  expect(after_redo_2[0]?.value).toBe('1new'); // verify code cell is set properly
  expect(after_redo_2[0]?.python_code).toBe('["1new", "2new", "3new", "4new", "5new"]\n');
  expect(after_redo_2[0]?.python_output).toBe('');
  expect(after_redo_2[0]?.last_modified).toBeDefined();
  expect(after_redo_2[0]?.type).toBe('PYTHON');
  expect(after_redo_2[0]?.array_cells?.length).toBe(5);
  after_redo_2.forEach((cell, index) => {
    expect(cell.value).toEqual((index + 1).toString() + 'new');
    if (index === 0) return;
    expect(cell.type).toEqual('COMPUTED');
  });
});
