import { Button } from '@/shadcn/ui/button';
import * as React from 'react';
import { Link, useSubmit } from 'react-router-dom';
import { useGlobalSnackbar } from '../../components/GlobalSnackbarProvider';
import { ROUTES } from '../../constants/routes';
import { validateAndUpgradeGridFile } from '../../schemas/validateAndUpgradeGridFile';
import { CreateActionRequest } from '../FilesCreateRoute';

// TODO this will need props when it becomes a button that can be used
// on the team page as well as the user's files page
export default function CreateFileButton() {
  const { addGlobalSnackbar } = useGlobalSnackbar();
  const submit = useSubmit();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // If nothing was selected, just exit
    if (!e.target.files) {
      return;
    }

    // Get the file and it's contents
    const file: File = e.target.files[0];
    const contents = await file.text().catch((e) => null);

    // Ensure it's a valid Quadratic grid file
    const validFile = await validateAndUpgradeGridFile(contents);
    if (!validFile) {
      addGlobalSnackbar('Import failed: invalid `.grid` file.', { severity: 'error' });
      return;
    }

    let data: CreateActionRequest;
    // Upload it
    if (validFile.version === '1.3') {
      data = {
        name: file.name ? file.name.replace('.grid', '') : 'Untitled',
        version: validFile.version,
        contents: JSON.stringify(validFile),
      };
    }
    // versions > 1.3
    else {
      data = {
        name: file.name ? file.name.replace('.grid', '') : 'Untitled',
        version: validFile.version,
        contents: validFile.contents, //JSON.stringify(validFile),
      };
    }
    submit(data, { method: 'POST', action: ROUTES.CREATE_FILE, encType: 'application/json' });
  };

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline">
        <label className="cursor-pointer">
          Import file
          <input type="file" name="content" accept=".grid" onChange={handleImport} hidden />
        </label>
      </Button>
      <Button asChild>
        <Link to={ROUTES.CREATE_FILE}>Create file</Link>
      </Button>
    </div>
  );
}
