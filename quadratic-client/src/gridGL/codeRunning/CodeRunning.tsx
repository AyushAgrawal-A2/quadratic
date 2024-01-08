import { sheets } from '@/grid/controller/Sheets';
import { multiplayer } from '@/multiplayer/multiplayer';
import { MULTIPLAYER_COLORS } from '@/multiplayer/multiplayerCursor/multiplayerColors';
import { pythonWebWorker } from '@/web-workers/pythonWebWorker/python';
import { CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { pixiApp } from '../pixiApp/PixiApp';
import './CodeRunning.css';

interface Code {
  left: string;
  top: string;
  color: string;
}

const CIRCULAR_PROGRESS_SIZE = 14;

export const CodeRunning = () => {
  const [transform, setTransform] = useState<string>('');
  const [code, setCode] = useState<Code[]>([]);

  useEffect(() => {
    const handleViewport = () => {
      const viewport = pixiApp.viewport;
      viewport.updateTransform();
      const worldTransform = viewport.worldTransform;
      setTransform(
        `matrix(${worldTransform.a},${worldTransform.b},${worldTransform.c},${worldTransform.d},${worldTransform.tx},${worldTransform.ty})`
      );
    };

    const updateCode = () => {
      const cells = pythonWebWorker.getRunningCells(sheets.sheet.id);
      const sheet = sheets.sheet;
      const code = cells.map((cell) => {
        const rectangle = sheet.getCellOffsets(cell.x, cell.y);
        return {
          left: `${rectangle.x + rectangle.width / 2 - CIRCULAR_PROGRESS_SIZE / 2}px`,
          top: `${rectangle.y + rectangle.height / 2 - CIRCULAR_PROGRESS_SIZE / 2}px`,
          color: 'black',
        };
      });
      multiplayer.getUsers().forEach((user) => {
        user.parsedCodeRunning.forEach((cell) => {
          if (cell.sheetId === sheet.id) {
            const rectangle = sheet.getCellOffsets(cell.x, cell.y);
            code.push({
              left: `${rectangle.x + rectangle.width / 2 - CIRCULAR_PROGRESS_SIZE / 2}px`,
              top: `${rectangle.y + rectangle.height / 2 - CIRCULAR_PROGRESS_SIZE / 2}px`,
              color: MULTIPLAYER_COLORS[user.color % MULTIPLAYER_COLORS.length],
            });
          }
        });
      });
      setCode(code);
    };

    pixiApp.viewport.on('moved', handleViewport);
    pixiApp.viewport.on('moved-end', handleViewport);
    pixiApp.viewport.on('zoomed', handleViewport);
    window.addEventListener('python-change', updateCode);
    window.addEventListener('change-sheet', updateCode);
    updateCode();
    handleViewport();

    return () => {
      pixiApp.viewport.off('moved', handleViewport);
      pixiApp.viewport.off('moved-end', handleViewport);
      pixiApp.viewport.off('zoomed', handleViewport);
      window.addEventListener('python-change', updateCode);
      window.removeEventListener('change-sheet', updateCode);
    };
  }, []);

  return (
    <div className="code-running-container">
      <div className="code-running" style={{ transform }}>
        {code.map((code, index) => (
          <CircularProgress
            size={`${CIRCULAR_PROGRESS_SIZE}px`}
            key={index}
            sx={{ position: 'absolute', left: code.left, top: code, color: code.color }}
          />
        ))}
      </div>
    </div>
  );
};
