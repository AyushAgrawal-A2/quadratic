import { Container, Rectangle } from 'pixi.js';
import { Sheet } from '../../grid/sheet/Sheet';
import { PixiApp } from '../pixiApp/PixiApp';
import { Coordinate } from '../types/size';
import { CellsSheet } from './CellsSheet';

export class CellsSheets extends Container<CellsSheet> {
  private app: PixiApp;
  private current?: CellsSheet;

  constructor(app: PixiApp) {
    super();
    this.app = app;
  }

  async create(): Promise<void> {
    this.removeChildren();
    for (const sheet of this.app.sheet_controller.sheets) {
      const child = this.addChild(new CellsSheet(sheet));
      await child.create();
    }
    this.show(this.app.sheet_controller.sheet.id);
  }

  show(id: string): void {
    this.children.forEach((child) => {
      if (child.sheet.id === id) {
        this.current = child;
        child.show(this.app.viewport.getVisibleBounds());
      } else {
        child.hide();
      }
    });
  }

  cull(bounds: Rectangle): void {
    if (!this.current) throw new Error('Expected current to be defined in CellsSheets');
    this.current.show(bounds);
  }

  changeCells(sheet: Sheet, cells: Coordinate[], options: { labels?: boolean; background?: boolean }) {
    const cellsSheet = this.children.find((search) => search.sheet.id === sheet.id);
    if (!cellsSheet) {
      throw new Error('Expected to find sheet in changeCells');
    }
    cellsSheet.changeCells(cells, options);
  }
}
