import { useState, DragEvent, useRef } from 'react';
import { InsertCSV } from '../../grid/actions/insertData/insertCSV';
import { SheetController } from '../../grid/controller/sheetController';
import { PixiApp } from '../../gridGL/pixiApp/PixiApp';
import { Coordinate } from '../../gridGL/types/size';

interface Props {
  sheetController: SheetController;
  app: PixiApp;
}

export const FileUploadWrapper = (props: React.PropsWithChildren<Props>) => {
  const { app } = props;
  // drag state
  const [dragActive, setDragActive] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  // handle drag events
  const handleDrag = function (e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // triggers when file is dropped
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv') {
        const clientBoudingRect = divRef?.current?.getBoundingClientRect();
        const world = app.viewport.toWorld(
          e.pageX - (clientBoudingRect?.left || 0),
          e.pageY - (clientBoudingRect?.top || 0)
        );
        const { column, row } = props.sheetController.sheet.gridOffsets.getRowColumnFromWorld(world.x, world.y);

        await InsertCSV({
          sheetController: props.sheetController,
          file: file,
          insertAtCellLocation: { x: column, y: row } as Coordinate,
        });
      }
    }
  };

  return (
    <div ref={divRef} onDragEnter={handleDrag} style={{ flex: 1 }}>
      {props.children}
      {dragActive && (
        <div
          id="drag-file-element"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: '0.5',
          }}
        ></div>
      )}
    </div>
  );
};
