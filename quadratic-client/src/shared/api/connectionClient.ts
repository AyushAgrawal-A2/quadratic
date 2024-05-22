import { authClient } from '@/auth';
import {
  ConnectionTypeDetailsMysqlSchema,
  ConnectionTypeDetailsPostgresSchema,
} from 'quadratic-shared/typesAndSchemasConnections';
import z from 'zod';
const API_URL = import.meta.env.VITE_QUADRATIC_CONNECTION_URL;

// TODO: (connections) these should come from the connection service definition for these endpoints
// but for now, they are defined here
const TestSchema = z.object({ connected: z.boolean(), message: z.string().nullable() });
export type TestConnectionResponse = z.infer<typeof TestSchema>;
const SqlSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  database: z.string(),
  tables: z.array(
    z.object({
      name: z.string(),
      schema: z.string(), // public or ...?
      columns: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          is_nullable: z.boolean(),
        })
      ),
    })
  ),
});
type SqlSchemaResponse = z.infer<typeof SqlSchema>;

export const connectionClient = {
  schemas: {
    get: async (connectionType: 'postgres' | 'mysql', connectionId: string): Promise<SqlSchemaResponse | null> => {
      try {
        let jwt = await authClient.getTokenOrRedirect();
        const res = await fetch(`${API_URL}/${connectionType}/schema/${connectionId}`, {
          method: 'GET',
          headers: new Headers({ 'content-type': 'application/json', authorization: `Bearer ${jwt}` }),
        });
        const data = await res.json();
        return SqlSchema.parse(data);
      } catch (err) {
        console.error('Failed to get the schema from the connection service', err);
        return null;
      }
    },
  },
  test: {
    run: async ({
      type,
      typeDetails,
    }:
      | { type: 'postgres'; typeDetails: z.infer<typeof ConnectionTypeDetailsPostgresSchema> }
      | { type: 'mysql'; typeDetails: z.infer<typeof ConnectionTypeDetailsMysqlSchema> }) => {
      try {
        let jwt = await authClient.getTokenOrRedirect();
        const res = await fetch(`${API_URL}/${type}/test`, {
          method: 'POST',
          headers: new Headers({ 'content-type': 'application/json', authorization: `Bearer ${jwt}` }),
          body: JSON.stringify(typeDetails),
        });
        const data = await res.json();
        return TestSchema.parse(data);
      } catch (err) {
        console.error('Failed to connect to connection service', err);
        return {
          connected: false,
          message:
            'Network error: failed to make connection. Make sure you’re connected to the internet and try again.',
        };
      }
    },
  },
};
