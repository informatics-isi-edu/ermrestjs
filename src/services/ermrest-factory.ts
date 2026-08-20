// models
import { InvalidInputError } from '@isrd-isi-edu/ermrestjs/src/models/errors';
import { Server } from '@isrd-isi-edu/ermrestjs/src/models/server';

// utils
import { isDefinedAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

const _servers: Record<string, Server> = {};

/**
 * ERMrest server factory creates or reuses ERMrest.Server instances. The
 * URI should be to the ERMrest _service_. For example,
 * `https://www.example.org/ermrest`.
 * @param uri URI of the ERMrest service.
 * @param contextHeaderParams An optional server header parameters for context logging
 * appended to the end of any request to the server (default: `{cid:'null'}`).
 * @return Returns a server instance.
 * @throws {InvalidInputError} URI is missing
 */
function getServer(uri: string, contextHeaderParams?: unknown): Server {
  if (!isDefinedAndNotNull(uri)) throw new InvalidInputError('URI undefined or null');

  if (!isDefinedAndNotNull(contextHeaderParams) || typeof contextHeaderParams !== 'object') {
    // Set default cid to a truthy string because a true null will not
    // appear as a query parameter but we want to track cid even when cid
    // isn't provided
    contextHeaderParams = { cid: 'null' };
  }

  let server = _servers[uri];
  if (!server) {
    server = new Server(uri, contextHeaderParams as { cid: string; pid?: string });
    _servers[uri] = server;
  }

  return server;
}

export const ermrestFactory = {
  getServer: getServer,
};
