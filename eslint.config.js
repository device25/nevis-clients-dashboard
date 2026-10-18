import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const DEEP_IMPORT = '@nevis/*/src/**';
const PARENT_PATHS = '../../*';

const allNevis = (name) => ({
  group: [name, `${name}/**`],
  message: `${name} is not available in this workspace.`,
});

/** Builds the full no-restricted-imports rule; ESLint replaces, not merges. */
function restrict({ groups = [], paths = [] } = {}) {
  return [
    'error',
    {
      paths,
      patterns: [
        {
          group: [DEEP_IMPORT],
          message: 'Import a package through its public entry point only.',
        },
        {
          group: [PARENT_PATHS],
          message:
            'Use a layer alias (#name) or a relative path within the module.',
        },
        ...groups,
      ],
    },
  ];
}

// A leading '#' starts a comment in gitignore-style patterns, so escape it.
const layer = (aliases, message) => ({
  group: aliases.map((alias) => `\\${alias}`),
  message,
});
const noReact = [
  { name: 'react', message: 'This layer does not depend on React.' },
  { name: 'react-dom', message: 'This layer does not depend on React.' },
];

const scopes = (files, rule) => ({
  files,
  rules: { 'no-restricted-imports': rule },
});

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.tsbuild/**',
      '**/node_modules/**',
      '.private/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-restricted-imports': restrict(),
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ['**/*.{js,mjs}'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: globals.node,
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },

  // contract: depends on nothing else in the workspace.
  scopes(
    ['packages/contract/**'],
    restrict({
      groups: [allNevis('@nevis/data'), allNevis('@nevis/design-system')],
      paths: noReact,
    }),
  ),

  // design-system: knows nothing about clients, so no workspace package at all.
  ...(() => {
    const noWorkspace = {
      group: ['@nevis/*', '@nevis/**'],
      message: '@nevis/design-system knows nothing about the other packages.',
    };
    const up = (aliases) => layer(aliases, 'Layers import downward only.');
    const base = { groups: [noWorkspace] };
    return [
      scopes(
        ['packages/design-system/src/tokens/**'],
        restrict({
          groups: [noWorkspace, up(['#layout', '#primitives', '#components'])],
        }),
      ),
      scopes(
        ['packages/design-system/src/{layout,primitives}/**'],
        restrict({ groups: [noWorkspace, up(['#components'])] }),
      ),
      scopes(['packages/design-system/src/components/**'], restrict(base)),
      scopes(
        ['packages/design-system/*.ts', 'packages/design-system/src/*.ts'],
        restrict(base),
      ),
    ];
  })(),

  // data: knows nothing about UI; the lower layers are also React-free.
  ...(() => {
    const noUi = {
      group: ['@nevis/design-system', '@nevis/design-system/**'],
      message: '@nevis/data knows nothing about UI.',
    };
    const up = (aliases) => layer(aliases, 'Layers import downward only.');
    return [
      scopes(
        ['packages/data/src/transport/**', 'packages/data/src/adapter/**'],
        restrict({ groups: [noUi], paths: noReact }),
      ),
      scopes(
        ['packages/data/src/transport/**'],
        restrict({
          groups: [noUi, up(['#adapter', '#queries', '#provider'])],
          paths: noReact,
        }),
      ),
      scopes(
        ['packages/data/src/adapter/**'],
        restrict({
          groups: [noUi, up(['#queries', '#provider'])],
          paths: noReact,
        }),
      ),
      scopes(
        ['packages/data/src/queries/**'],
        restrict({ groups: [noUi, up(['#provider'])] }),
      ),
      scopes(
        [
          'packages/data/src/provider/**',
          'packages/data/src/testing/**',
          'packages/data/src/*.ts',
          'packages/data/src/*.tsx',
          'packages/data/*.ts',
        ],
        restrict({ groups: [noUi] }),
      ),
    ];
  })(),

  // api: no UI, no data package, never the web app.
  scopes(
    ['apps/api/**'],
    restrict({
      groups: [
        allNevis('@nevis/data'),
        allNevis('@nevis/design-system'),
        { group: ['web', 'web/**'], message: 'api never imports web.' },
      ],
      paths: noReact,
    }),
  ),
  scopes(
    ['apps/api/src/data/**'],
    restrict({
      groups: [
        allNevis('@nevis/data'),
        allNevis('@nevis/design-system'),
        layer(['#routes'], 'Layers import downward only.'),
      ],
      paths: noReact,
    }),
  ),

  // web: no direct contract or query library; the model is UI-free.
  ...(() => {
    const noInternals = [
      allNevis('@nevis/contract'),
      {
        group: ['@tanstack/react-query', '@tanstack/react-query/**'],
        message: 'The data package hides TanStack Query from the app.',
      },
      { group: ['api', 'api/**'], message: 'web never imports api.' },
    ];
    return [
      scopes(['apps/web/**'], restrict({ groups: noInternals })),
      scopes(
        ['apps/web/src/features/clients/ui/**'],
        restrict({ groups: noInternals }),
      ),
      scopes(
        ['apps/web/src/features/clients/model/**'],
        restrict({
          groups: [
            ...noInternals,
            allNevis('@nevis/design-system'),
            layer(['#ui'], 'Layers import downward only.'),
          ],
          paths: noReact,
        }),
      ),
    ];
  })(),
);
