/**
 * A LabelMeshEntry is a Mesh of a specific font and style that holds the
 * vertices, uvs, and indices for the hashed region of text.
 *
 * There may be multiple LabelMeshEntries for a single font/style combination to
 * ensure that the webGL buffers do not exceed the maximum size. These meshes
 * are rendered.
 */

import { debugShowCellHashesInfo } from '@/debugFlags';
import { renderClient } from '../renderClient';
import { LabelMesh } from './LabelMesh';

export class LabelMeshEntry {
  private labelMesh: LabelMesh;
  private total: number;

  index = 0;
  vertexCount = 0;
  uvsCount = 0;
  size = 0;

  indices?: Uint16Array;
  vertices?: Float32Array;
  uvs?: Float32Array;
  colors?: Float32Array;

  constructor(labelMesh: LabelMesh, total: number) {
    this.labelMesh = labelMesh;
    this.total = total;
    this.clear();
  }

  // used to clear the buffers for reuse
  clear() {
    this.vertices = new Float32Array(4 * 2 * this.total);
    this.uvs = new Float32Array(4 * 2 * this.total);
    this.indices = new Uint16Array(6 * this.total);
    this.size = 6 * this.total;
    this.index = 0;

    if (this.labelMesh.hasColor) {
      this.colors = new Float32Array(4 * 4 * this.total);
    }
  }

  // finalizes the buffers for rendering
  finalize() {
    if (!this.vertices || !this.uvs || !this.indices) {
      throw new Error('Expected LabelMeshEntries.finalize to have buffers');
    }
    if (this.labelMesh.hasColor) {
      if (!this.colors) {
        throw new Error('Expected LabelMeshEntries.finalize to have colors');
      }
      renderClient.sendLabelMeshEntry(
        {
          textureUid: this.labelMesh.textureUid,
          hasColor: this.labelMesh.hasColor,
          vertices: this.vertices,
          uvs: this.uvs,
          indices: this.indices,
          colors: this.colors,
        },
        [this.vertices.buffer, this.uvs.buffer, this.indices.buffer, this.colors.buffer]
      );
    } else {
      renderClient.sendLabelMeshEntry(
        {
          textureUid: this.labelMesh.textureUid,
          hasColor: this.labelMesh.hasColor,
          vertices: this.vertices,
          uvs: this.uvs,
          indices: this.indices,
        },
        [this.vertices.buffer, this.uvs.buffer, this.indices.buffer]
      );
    }

    if (debugShowCellHashesInfo) {
      console.log(`[LabelMeshes] buffer size: ${this.size}`);
    }
  }

  reduceSize(delta: number) {
    this.size -= delta;
  }
}
