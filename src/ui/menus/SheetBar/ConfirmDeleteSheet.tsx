import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { SheetController } from '../../../grid/controller/sheetController';
import { deleteSheet } from '../../../grid/actions/sheetsAction';

interface Props {
  sheetController: SheetController;

  // holds the last sheet's name so when it's deleted the name dialog doesn't change as it's closing
  lastName?: string;

  confirmDelete: { id: string; name: string } | undefined;
  handleClose: () => void;
}

export const ConfirmDeleteSheet = (props: Props): JSX.Element => {
  const { sheetController, confirmDelete, lastName, handleClose } = props;

  return (
    <Dialog open={!!confirmDelete?.name}>
      <DialogTitle>Delete Sheet</DialogTitle>
      <DialogContent>Are you sure you want to delete {confirmDelete?.name ?? lastName}?</DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          color="warning"
          onClick={() => {
            if (confirmDelete) {
              deleteSheet({ sheetController, sheet: sheetController.sheet, create_transaction: true });
              sheetController.deleteSheet(confirmDelete.id);
            }
            handleClose();
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
