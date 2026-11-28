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
const componentPath = resolve(testDir, '../src/components/StayHostInfoCard.tsx');

function renderHostCard(props) {
  const source = readFileSync(componentPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: componentPath,
  });

  const module = { exports: {} };
  const jsxRuntime = {
    jsx: (type, elementProps) => ({ type, props: elementProps ?? {} }),
    jsxs: (type, elementProps) => ({ type, props: elementProps ?? {} }),
    Fragment: 'Fragment',
  };
  const reactNative = {
    StyleSheet: { create: (styles) => styles },
    Text: 'Text',
    View: 'View',
  };
  const localRequire = (specifier) => {
    if (specifier === 'react') return {};
    if (specifier === 'react-native') return reactNative;
    if (specifier === 'react/jsx-runtime') return jsxRuntime;
    if (specifier === '../lib/booking-calculations.mjs') {
      return { getDisplayInitials: () => 'SH' };
    }
    throw new Error(`Unexpected component dependency: ${specifier}`);
  };

  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: localRequire,
  }, { filename: componentPath });

  return module.exports.StayHostInfoCard(props);
}

function findNodes(node, predicate, matches = []) {
  if (!node || typeof node !== 'object') return matches;
  if (predicate(node)) matches.push(node);
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    findNodes(child, predicate, matches);
  }
  return matches;
}

test('avatar initials are excluded from the accessibility tree', () => {
  const tree = renderHostCard({ displayName: 'Samir', locale: 'ar' });
  const avatar = findNodes(
    tree,
    (node) => node.type === 'View' && node.props.importantForAccessibility === 'no',
  )[0];

  assert.ok(avatar, 'avatar container should be present');
  assert.equal(avatar.props.accessible, false);
  assert.equal(avatar.props.importantForAccessibility, 'no');
  assert.equal(avatar.props.accessibilityLabel, undefined);
});

test('host display name is exposed as a navigable heading', () => {
  const tree = renderHostCard({ displayName: 'Samir', locale: 'ar' });
  const name = findNodes(
    tree,
    (node) => node.type === 'Text' && node.props.children === 'Samir',
  )[0];

  assert.ok(name, 'host display name should be present');
  assert.equal(name.props.accessibilityRole, 'header');
});

test('verified status has a clean localized accessibility label', () => {
  const tree = renderHostCard({
    displayName: 'Samir',
    locale: 'ar',
    isVerifiedHost: true,
  });
  const verified = findNodes(
    tree,
    (node) => node.type === 'Text' && node.props.accessibilityLabel === 'مضيف تم التحقق منه',
  )[0];

  assert.ok(verified, 'verified status should be present');
  assert.equal(verified.props.accessibilityLabel, 'مضيف تم التحقق منه');
  assert.deepEqual(Array.from(verified.props.children), ['✓ ', 'مضيف تم التحقق منه']);
});

test('French verified status uses the French accessibility label', () => {
  const tree = renderHostCard({
    displayName: 'Samir',
    locale: 'fr',
    isVerifiedHost: true,
  });
  const verified = findNodes(
    tree,
    (node) => node.type === 'Text' && node.props.accessibilityLabel === 'Hôte vérifié',
  )[0];

  assert.ok(verified, 'verified status should be present');
  assert.equal(verified.props.accessibilityLabel, 'Hôte vérifié');
});
