import { CommandPaletteListItem } from '../CommandPaletteListItem';
import { OpenInNew } from '@mui/icons-material';
import { DOCUMENTATION_URL, BUG_REPORT_URL } from '../../../../constants/urls';
import { ComposableCommandPaletteListItemProps } from '../CommandPaletteListItem';

const ListItems = [
  {
    label: 'Help: View the docs',
    Component: (props: ComposableCommandPaletteListItemProps) => (
      <CommandPaletteListItem
        {...props}
        icon={<OpenInNew />}
        action={() => {
          window.open(DOCUMENTATION_URL, '_blank')?.focus();
        }}
      />
    ),
  },
  {
    label: 'Help: Report a problem',
    Component: (props: ComposableCommandPaletteListItemProps) => (
      <CommandPaletteListItem
        {...props}
        icon={<OpenInNew />}
        action={() => {
          window.open(BUG_REPORT_URL, '_blank')?.focus();
        }}
      />
    ),
  },
];

export default ListItems;
