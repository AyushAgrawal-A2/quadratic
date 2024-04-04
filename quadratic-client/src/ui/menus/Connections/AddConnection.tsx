import { Button } from '@/shadcn/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shadcn/ui/dialog';
import { useEffect, useRef, useState } from 'react';
// quadratic-api/src/routes/connections/types/Base
import { Type } from '@/components/Type';
import { Input } from '@/shadcn/ui/input';
import { Label } from '@/shadcn/ui/label';
import { cn } from '@/shadcn/utils';
import { CircularProgress } from '@mui/material';
import { CheckCircledIcon, ExclamationTriangleIcon, InfoCircledIcon, PlayIcon } from '@radix-ui/react-icons';
import { useSearchParams } from 'react-router-dom';
import { ConnectionConfiguration } from '../../../../../quadratic-api/src/routes/connections/types/Base'; // TODO: fix this path
import { apiClient } from '../../../api/apiClient';

export const AddConnection = () => {
  const [connectionState, setConnectionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [connectionSchema, setConnectionSchema] = useState<undefined | ConnectionConfiguration>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const connections = searchParams.get('connections');
  const open = connections === 'add-postgres' || connections === 'add-mysql';
  const onClose = () => {
    setSearchParams((prev) => {
      prev.delete('connections');
      return prev;
    });
  };

  useEffect(() => {
    apiClient.getSupportedConnections().then((result) => {
      console.log('supported connections:', result);
      setConnectionSchema(result[0]);
    });
  }, []);

  // Reset modal state when it closes
  useEffect(() => {
    setConnectionState('idle');
  }, [searchParams]);

  console.log('connectionSchema:', connectionSchema);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {connectionSchema?.name} connection</DialogTitle>
          <DialogDescription>
            For more information on setting up {connectionSchema?.name},{' '}
            <a href="#TODO:" className="underline">
              read our docs
            </a>
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onChange={() => {
            setConnectionState('idle');
          }}
          onSubmit={(form) => {
            form.preventDefault();

            console.log(form);
          }}
          className="grid gap-4"
        >
          <InputWithLabel>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" placeholder="My database" required autoComplete="off" />
          </InputWithLabel>
          <div className="grid grid-cols-3 gap-4">
            <InputWithLabel className="col-span-2">
              <Label htmlFor="host">Host</Label>
              <Input id="host" name="host" type="text" placeholder="0.0.0.0" required autoComplete="off" />
            </InputWithLabel>
            <InputWithLabel>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                name="port"
                type="number"
                placeholder="0.0.0.0"
                required
                autoComplete="off"
                // onKeyDown={(e) => {
                //   const currentValue = e.target.value;
                //   const keyPressed = e.key;

                //   const isDigit = /^\d+$/.test(keyPressed);
                //   if (!isDigit && ) {
                //     e.preventDefault();
                //     return;
                //   }

                //   const newValue = Number(`${currentValue}${keyPressed}`);
                //   if (newValue > 65535) {
                //     e.preventDefault();
                //     return;
                //   }

                //   console.log('valid');
                // }}
                className="no-stepper"
                min="0"
                max="5432"
              />
            </InputWithLabel>
          </div>
          <InputWithLabel>
            <Label htmlFor="database">Database</Label>
            <Input id="database" name="database" type="text" placeholder="my_database" required autoComplete="off" />
          </InputWithLabel>
          <div className="grid grid-cols-2 gap-4">
            <InputWithLabel>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" placeholder="root" required autoComplete="off" />
            </InputWithLabel>
            <InputWithLabel>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="root" required autoComplete="off" />
            </InputWithLabel>
          </div>

          {
            /*connectionSchema?.connectionFields.map((field, index) => {
            return (
              <InputWithLabel key={index}>
                <Label htmlFor={field.name}>{field.name}</Label>
                <Input
                  id={field.name}
                  placeholder="TODO"
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  autoComplete="off"
                  readOnly={true}
                  type={field.sensitive === 'AWS_SECRET' ? 'password' : 'text'}
                  value={formData[field.name] || ''}
                />
              </InputWithLabel>

              // value={formData[field.name] || ''} // Use the formData value
            );
          })*/ ''
          }

          <div
            className={cn(
              'flex items-center rounded border-2 px-2 py-2 pl-3',
              connectionState === 'idle' && 'border-border',
              connectionState === 'success' && 'border-success',
              connectionState === 'error' && 'border-destructive'
            )}
          >
            <div className="flex items-center gap-2">
              {connectionState === 'idle' && (
                <>
                  <InfoCircledIcon className="text-muted-foreground" />
                  <Type>Connection must be tested</Type>
                </>
              )}
              {connectionState === 'loading' && (
                <>
                  <CircularProgress style={{ width: 15, height: 15 }} />
                  <Type>Testing…</Type>
                </>
              )}
              {connectionState === 'success' && (
                <>
                  <CheckCircledIcon className="text-success" />
                  <Type>Connection ok!</Type>
                </>
              )}
              {connectionState === 'error' && (
                <>
                  <ExclamationTriangleIcon className="text-destructive" />
                  <Type>Connection failed. Adjust details and try again.</Type>
                </>
              )}
            </div>
            <Button
              className="ml-auto"
              variant="secondary"
              disabled={false}
              onClick={async () => {
                setConnectionState((prev) =>
                  prev === 'idle' ? 'loading' : prev === 'loading' ? 'success' : prev === 'success' ? 'error' : 'idle'
                );
                return;

                await new Promise((resolve) => setTimeout(resolve, 3000));

                // const response = await apiClient.createConnection(formData as ApiTypes['/v0/connections.POST.request']); // TODO: typecasting here is unsafe
                // console.log('response:', response);
                // const data = await apiClient.runConnection(response.uuid, {
                //   query: `
                //   SELECT
                //       datname AS database_name,
                //       pg_get_userbyid(datdba) AS owner,
                //       pg_database.datistemplate,
                //       pg_database.datallowconn,
                //       datacl
                //   FROM
                //       pg_database
                //   LEFT JOIN
                //       pg_namespace ON datname = nspname;`,
                // });
                // console.log('data:', data);

                setConnectionState('success');
              }}
            >
              <PlayIcon className="mr-1" /> Test
            </Button>
          </div>
        </form>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          <Button onClick={onClose} disabled={connectionState !== 'success'}>
            Add connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function InputWithLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid w-full  items-center gap-1.5', className)}>{children}</div>;
}
