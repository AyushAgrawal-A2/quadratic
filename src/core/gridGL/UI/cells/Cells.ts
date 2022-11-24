import { Container, Rectangle } from 'pixi.js';
import { CELL_TEXT_MARGIN_LEFT, CELL_TEXT_MARGIN_TOP } from '../../../../constants/gridConstants';
import { CellRectangle } from '../../../gridDB/CellRectangle';
import { Cell, CellFormat } from '../../../gridDB/db';
import { PixiApp } from '../../pixiApp/PixiApp';
import { CellsArray } from './CellsArray';
import { CellsBackground } from './cellsBackground';
import { CellsBorder } from './CellsBorder';
import { CellsLabels } from './CellsLabels';
import { CellsMarkers } from './CellsMarkers';

export interface CellsBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ICellsDraw {
  x: number;
  y: number;
  width: number;
  height: number;
  cell?: Cell;
  format?: CellFormat;
}

export class Cells extends Container {
  private app: PixiApp;
  private cellsArray: CellsArray;
  private cellsBorder: CellsBorder;
  private labels: CellsLabels;
  private cellsMarkers: CellsMarkers;

  cellsBackground: CellsBackground;
  dirty = true;

  constructor(app: PixiApp) {
    super();
    this.app = app;

    // this is added directly in pixiApp to control z-index (instead of using pixi's sortable children)
    this.cellsBackground = new CellsBackground();
    this.cellsArray = this.addChild(new CellsArray(app));
    this.cellsBorder = this.addChild(new CellsBorder(app));
    this.labels = this.addChild(new CellsLabels());
    this.cellsMarkers = this.addChild(new CellsMarkers());
  }

  /**
   * Draws all items within the visible bounds
   * @param bounds visible bounds
   * @param cellRectangle data for entries within the visible bounds
   * @param ignoreInput if false then don't draw input location (as it's handled by the DOM)
   * @returns a Rectangle of the content bounds (not including empty area), or undefined if nothing is drawn
   */
  drawBounds(bounds: Rectangle, cellRectangle: CellRectangle, ignoreInput?: boolean): Rectangle | undefined {
    const { gridOffsets } = this.app;
    this.labels.clear();
    this.cellsMarkers.clear();
    this.cellsArray.clear();
    this.cellsBackground.clear();
    this.cellsBorder.clear();

    const input = !ignoreInput && this.app.settings.interactionState.showInput
      ? {
          column: this.app.settings.interactionState.cursorPosition.x,
          row: this.app.settings.interactionState.cursorPosition.y,
        }
      : undefined;

    // keeps track of screen position
    const xStart = gridOffsets.getColumnPlacement(bounds.left).x;
    const yStart = gridOffsets.getRowPlacement(bounds.top).y;
    let y = yStart;
    let blank = true;
    const content = new Rectangle(Infinity, Infinity, -Infinity, -Infinity);

    // iterate through the rows and columns
    for (let row = bounds.top; row <= bounds.bottom; row++) {
      let x = xStart;
      const height = gridOffsets.getRowHeight(row);
      for (let column = bounds.left; column <= bounds.right; column++) {
        const width = gridOffsets.getColumnWidth(column);
        const entry = cellRectangle.get(column, row);
        if (entry) {
          const hasContent = entry.cell?.value || entry.format;

          if (hasContent) {
            blank = false;
            if (x < content.left) content.x = x;
            if (y < content.top) content.y = y;
          }

          // don't render input (unless ignoreInput === true)
          const isInput = input && input.column === column && input.row === row;

          // only render if there is cell data, cell formatting
          if (!isInput && (entry.cell || entry.format)) {
            this.cellsBorder.draw({ ...entry, x, y, width, height });
            this.cellsBackground.draw({ ...entry, x, y, width, height });
            if (entry.cell) {
              if (entry.cell?.type === 'PYTHON') {
                this.cellsMarkers.add(x, y, 'CodeIcon');
              }
              this.labels.add({
                x: x + CELL_TEXT_MARGIN_LEFT,
                y: y + CELL_TEXT_MARGIN_TOP,
                text: entry.cell.value,
              });
            }
          }
          if (entry.cell?.array_cells) {
            this.cellsArray.draw(entry.cell.array_cells, x, y, width, height);
          }

          if (hasContent) {
            if (x + width > content.right) content.width = x + width - content.left;
            if (y + height > content.bottom) content.height = y + height - content.top;
          }
        }
        x += width;
      }
      x = xStart;
      y += height;
    }

    if (!blank) {
      // renders labels
      this.labels.update();
      return content;
    }
  }

  update(): void {
    if (this.dirty) {
      this.dirty = false;
      const bounds = this.app.grid.getBounds(this.app.viewport.getVisibleBounds());
      const cellRectangle = this.app.grid.getCells(bounds);
      this.drawBounds(bounds, cellRectangle);
    }
  }

  debugShowCachedCounts(): void {
    this.cellsArray.debugShowCachedCounts();
    this.cellsBorder.debugShowCachedCounts();
    // this.labels.debugShowCachedCount();
    this.cellsMarkers.debugShowCachedCounts();
    this.cellsBackground.debugShowCachedCounts();
  }
}
