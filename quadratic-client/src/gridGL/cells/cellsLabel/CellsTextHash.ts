/**
 * CellsTextHash is the parent container for the text of cells in a hashed
 * region of the sheet.
 *
 * It contains LabelMeshes children. LabelMeshes are rendered meshes for each
 * font and style combination. LabelMeshes are populated using the data within
 * each CellLabel within the hashed region. LabelMeshes may contain multiple
 * LabelMesh children of the same font/style combination to ensure that the
 * webGL buffers do not exceed the maximum size.
 */

import { pixiApp } from '@/gridGL/pixiApp/PixiApp';
import { RenderClientLabelMeshEntry } from '@/web-workers/renderWebWorker/renderClientMessages';
import { Container, Graphics, Rectangle, Renderer } from 'pixi.js';
import { Sheet } from '../../../grid/sheet/Sheet';
import { sheetHashHeight, sheetHashWidth } from '../CellsTypes';
import { CellsLabels } from './CellsLabels';
import { LabelMeshEntry } from './LabelMeshEntry';

// Draw hashed regions of cell glyphs (the text + text formatting)
export class CellsTextHash extends Container<LabelMeshEntry> {
  private cellsLabels: CellsLabels;

  hashX: number;
  hashY: number;

  // column/row bounds (does not include overflow cells)
  AABB: Rectangle;

  // received from render web worker and used for culling
  visibleRectangle: Rectangle;

  // todo: not sure if this is still used as I ran into issues with only rendering buffers:

  // color to use for drawDebugBox
  debugColor = Math.floor(Math.random() * 0xffffff);

  constructor(
    cellsLabels: CellsLabels,
    x: number,
    y: number,
    bounds: { x: number; y: number; width: number; height: number }
  ) {
    super();
    this.cellsLabels = cellsLabels;
    this.AABB = new Rectangle(x * sheetHashWidth, y * sheetHashHeight, sheetHashWidth - 1, sheetHashHeight - 1);
    this.visibleRectangle = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
    this.hashX = x;
    this.hashY = y;
  }

  addLabelMeshEntry(message: RenderClientLabelMeshEntry) {
    this.addChild(new LabelMeshEntry(message));
    pixiApp.setViewportDirty();
  }

  clearMeshEntries(bounds: { x: number; y: number; width: number; height: number }) {
    this.removeChildren();
    this.visibleRectangle = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  get sheet(): Sheet {
    return this.cellsLabels.sheet;
  }

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  // overrides container's render function
  render(renderer: Renderer) {
    if (this.visible && this.worldAlpha > 0 && this.renderable) {
      const { a, b, c, d } = this.transform.worldTransform;
      const dx = Math.sqrt(a * a + b * b);
      const dy = Math.sqrt(c * c + d * d);
      const worldScale = (Math.abs(dx) + Math.abs(dy)) / 2;
      const resolution = renderer.resolution;
      const scale = worldScale * resolution;
      this.children.forEach((child) => child.renderSpecial(renderer, scale));
    }
  }

  drawDebugBox(g: Graphics) {
    const screen = this.sheet.getScreenRectangle(this.AABB.left, this.AABB.top, this.AABB.width, this.AABB.height);
    g.beginFill(this.debugColor, 0.25);
    g.drawShape(screen);
    g.endFill();
  }

  // TODO: we'll need to send this over as part of the render message
  getCellsContentMaxWidth(column: number): number {
    let max = 0;
    // this.labels.forEach((label) => {
    //   if (label.location.x === column) {
    //     max = Math.max(max, label.textWidth);
    //   }
    // });
    return max;
  }

  // TODO: we will need to replace this with boxes to avoid rerendering the hashes. this means we'll have to share each CellLabel's bounds
  showLabel(x: number, y: number, show: boolean) {
    // const label = this.getLabel(x, y);
    // if (label && label.visible !== show) {
    //   label.visible = show;
    //   this.dirtyBuffers = true;
    // }
  }
}
