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
const gatePath = resolve(testDir, '../src/components/AdminGate.tsx');

function loadGate() {
  const source = readFileSync(gatePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: gatePath,
  });
  const module = { exports: {} };
  const react = {
    createElement: (type, props) => ({ type, props: props ?? {} }),
  };
  const localRequire = (specifier) => {
    if (specifier === 'react') return react;
    if (specifier === '../types/admin-gate') return {};
    throw new Error(`Unexpected gate dependency: ${specifier}`);
  };

  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: localRequire,
  }, { filename: gatePath });

  return module.exports;
}

test('renders protected children for an authorized state', () => {
  const { AdminGate } = loadGate();
  const protectedContent = { type: 'ProtectedAdminWorkspace' };
  const result = AdminGate({
    state: { status: 'authorized', userId: 'admin-1', checkedAt: 1 },
    children: protectedContent,
  });
  assert.equal(result, protectedContent);
});

test('does not render protected children in any non-authorized state', () => {
  const { AdminGate } = loadGate();
  const protectedContent = { type: 'ProtectedAdminWorkspace' };
  const states = [
    { status: 'checking' },
    { status: 'unauthenticated' },
    { status: 'forbidden' },
    { status: 'session_expired' },
    { status: 'unavailable', retryable: true },
  ];

  for (const state of states) {
    assert.equal(AdminGate({ state, children: protectedContent }), null, state.status);
  }
});

test('renders only the supplied fallback when access is not authorized', () => {
  const { AdminGate } = loadGate();
  const protectedContent = { type: 'ProtectedAdminWorkspace' };
  const fallback = { type: 'AccessStatus' };
  const result = AdminGate({
    state: { status: 'forbidden' },
    children: protectedContent,
    fallback,
  });
  assert.equal(result, fallback);
});
