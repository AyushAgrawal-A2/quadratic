import { events } from '@/events/events';
import { quadraticCore } from '@/web-workers/quadraticCore/quadraticCore';
import { useEffect, useMemo, useState } from 'react';
import { hasPermissionToEditFile } from '../../../../actions';
import { sheets } from '../../../../grid/controller/Sheets';
import { focusGrid } from '../../../../helpers/focusGrid';
import { CommandPaletteListItem } from '../CommandPaletteListItem';
import { Commands } from '../getCommandPaletteListItems';

const ListItems = () => {
  // used to trigger changes in sheets
  const [trigger, setTrigger] = useState(0);

  const items = useMemo(() => {
    const items: Commands[] = [
      {
        label: 'Sheet: Create',
        isAvailable: hasPermissionToEditFile,
        Component: (props: any) => {
          return <CommandPaletteListItem {...props} action={() => sheets.userAddSheet()} />;
        },
      },
      {
        label: 'Sheet: Delete',
        isAvailable: hasPermissionToEditFile,
        Component: (props: any) => {
          return (
            <CommandPaletteListItem
              {...props}
              action={() => {
                if (window.confirm(`Are you sure you want to delete ${sheets.sheet.name}?`)) {
                  sheets.userDeleteSheet(sheets.sheet.id);
                }
                setTimeout(focusGrid);
              }}
            />
          );
        },
      },
      {
        label: 'Sheet: Duplicate',
        isAvailable: hasPermissionToEditFile,
        Component: (props: any) => {
          return (
            <CommandPaletteListItem
              {...props}
              action={() => quadraticCore.duplicateSheet(sheets.sheet.id, sheets.getCursorPosition())}
            />
          );
        },
      },
    ];
    sheets.forEach((sheet) => {
      items.push({
        label: `Sheet: Switch to “${sheet.name}”`,
        isAvailable: () => sheets.current !== sheet.id,
        Component: (props: any) => {
          return (
            <CommandPaletteListItem
              {...props}
              icon={
                sheet.color ? (
                  <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '3px',
                        backgroundColor: sheet.color,
                        borderRadius: '1px',
                      }}
                    />
                  </div>
                ) : undefined
              }
              action={() => (sheets.current = sheet.id)}
            />
          );
        },
      });
    });
    return items;

    // trigger is only used to trigger changes (and will be shown as a warning)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    const updateTrigger = () => setTrigger((trigger) => trigger + 1);
    events.on('changeSheet', updateTrigger);
    return () => {
      events.off('changeSheet', updateTrigger);
    };
  }, []);

  return items;
};

export default ListItems;
