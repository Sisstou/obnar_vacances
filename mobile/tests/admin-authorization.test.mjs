import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const testDir = dirname(fileURLToPath(import.meta.url));
const servicePath = resolve(testDir, '../src/services/admin-authorization.service.ts');

function loadService(client, configured = true) {
  const source = readFileSync(servicePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: servicePath,
  });
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === '../lib/supabase') {
      return { supabase: client, supabaseConfigured: configured };
    }
    throw new Error(`Unexpected service dependency: ${specifier}`);
  };

  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: localRequire,
    Date,
  }, { filename: servicePath });

  return module.exports;
}

function createClient({
  session = { access_token: 'test-token' },
  sessionError = null,
  user = { id: 'admin-user' },
  userError = null,
  rpcData = true,
  rpcError = null,
  throwAt = null,
} = {}) {
  return {
    auth: {
      getSession: async () => {
        if (throwAt === 'getSession') throw new Error('network failure');
        return { data: { session }, error: sessionError };
      },
      getUser: async () => {
        if (throwAt === 'getUser') throw new Error('network failure');
        return { data: { user }, error: userError };
      },
    },
    rpc: async () => {
      if (throwAt === 'rpc') throw new Error('network failure');
      return { data: rpcData, error: rpcError };
    },
  };
}

test('authorizes a verified main administrator only when RPC returns true', async () => {
  const service = loadService(createClient());
  const state = await service.verifyAdminAuthorization();

  assert.equal(state.status, 'authorized');
  assert.equal(state.userId, 'admin-user');
  assert.equal(typeof state.checkedAt, 'number');
});

test('forbids an authenticated ordinary user when RPC returns false', async () => {
  const service = loadService(createClient({ rpcData: false }));
  assert.equal((await service.verifyAdminAuthorization()).status, 'forbidden');
});

test('rejects a user with no active session before calling Auth user or RPC', async () => {
  const client = createClient({ session: null });
  const service = loadService(client);
  assert.equal((await service.verifyAdminAuthorization()).status, 'unauthenticated');
});

test('classifies an expired Auth session separately', async () => {
  const service = loadService(createClient({
    userError: { name: 'AuthSessionMissingError', status: 400 },
  }));
  assert.equal((await service.verifyAdminAuthorization()).status, 'session_expired');
});

test('fails closed and marks an RPC network failure as retryable unavailable', async () => {
  const service = loadService(createClient({ throwAt: 'rpc' }));
  const state = await service.verifyAdminAuthorization();
  assert.equal(state.status, 'unavailable');
  assert.equal(state.retryable, true);
});

test('does not authorize an unexpected non-boolean RPC response', async () => {
  const service = loadService(createClient({ rpcData: null }));
  const state = await service.verifyAdminAuthorization();
  assert.equal(state.status, 'unavailable');
  assert.equal(state.retryable, false);
});

test('does not call Supabase when the public client is not configured', async () => {
  const service = loadService(createClient(), false);
  const state = await service.verifyAdminAuthorization();
  assert.equal(state.status, 'unavailable');
  assert.equal(state.retryable, false);
});
