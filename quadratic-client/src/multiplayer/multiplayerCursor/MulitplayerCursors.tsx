import { sheets } from '@/grid/controller/Sheets';
import { pixiApp } from '@/gridGL/pixiApp/PixiApp';
import { useEffect, useState } from 'react';
import { multiplayer } from '../multiplayer';
import { MultiplayerCursor } from './MultiplayerCursor';
import './MultiplayerCursors.css';
import { MULTIPLAYER_COLORS } from './multiplayerColors';

const OFFSCREEN_SIZE = 5;

export const MultiplayerCursors = () => {
  // triggers a render
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setPlayersTrigger] = useState(0);
  useEffect(() => {
    const updatePlayersTrigger = () => setPlayersTrigger((x) => x + 1);
    window.addEventListener('multiplayer-cursor', updatePlayersTrigger);
    window.addEventListener('change-sheet', updatePlayersTrigger);
    pixiApp.viewport.on('moved', updatePlayersTrigger);
    pixiApp.viewport.on('zoomed', updatePlayersTrigger);
    return () => {
      window.removeEventListener('multiplayer-cursor', updatePlayersTrigger);
      window.removeEventListener('change-sheet', updatePlayersTrigger);
      pixiApp.viewport.off('moved', updatePlayersTrigger);
      pixiApp.viewport.off('zoomed', updatePlayersTrigger);
    };
  }, []);

  return (
    <div className="multiplayer-cursors">
      {[...multiplayer.users].flatMap(([id, player]) => {
        const color = MULTIPLAYER_COLORS[player.color];
        const bounds = pixiApp.viewport.getVisibleBounds();
        const rect = pixiApp.canvas.getBoundingClientRect();
        const offsetTop = rect.top;
        const { x, y, sheetId, firstName, lastName, visible, index } = player;
        const name = firstName || lastName ? `${firstName} ${lastName}` : `User ${index}`;

        if (visible && x !== undefined && y !== undefined && sheetId === sheets.sheet.id) {
          const translated = pixiApp.viewport.toScreen(x, y);
          let offscreen = false;
          if (x > bounds.right - OFFSCREEN_SIZE) {
            offscreen = true;
            translated.x = rect.right - OFFSCREEN_SIZE * 2;
          } else if (x < bounds.left) {
            offscreen = true;
            translated.x = rect.left;
          }
          if (y > bounds.bottom) {
            offscreen = true;
            translated.y = rect.bottom;
          } else if (y < bounds.top - offsetTop + OFFSCREEN_SIZE) {
            offscreen = true;
            translated.y = rect.top - offsetTop;
          }
          return [
            <MultiplayerCursor
              key={id}
              x={translated.x}
              y={translated.y}
              name={name}
              color={color}
              offscreen={offscreen}
            />,
          ];
        }
        return [];
      })}
    </div>
  );
};
