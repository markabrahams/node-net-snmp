module.exports = [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',

                // Node.js globals
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                console: 'readonly',
                exports: 'readonly',
                Buffer: 'readonly',
                setInterval: 'readonly',
                setTimeout: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly',

                // Mocha globals
                describe: 'readonly',
                it: 'readonly',
                before: 'readonly',
                after: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',

                // ES6 globals
                Promise: 'readonly',
                Set: 'readonly',
                Map: 'readonly',

                // User-defined globals
                $: 'readonly',
                System: 'readonly',
                expect: 'readonly',
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        rules: {
            'accessor-pairs': 'error',
            'arrow-spacing': 'error',
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            camelcase: ['error', { properties: 'never' }],
            'comma-spacing': ['error', { before: false, after: true }],
            'eol-last': ['error', 'always'],
            'key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'minimum' }],
            'keyword-spacing': ['error', {}],
            'no-cond-assign': 'error',
            'no-console': ['off', { allow: ['warn', 'error'] }],
            'no-constant-condition': ['error', { checkLoops: false }],
            'no-eval': 'error',
            'no-fallthrough': 'off',
            'no-mixed-spaces-and-tabs': 'error',
            'no-restricted-globals': ['error', 'event'],
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "*:not(ExpressionStatement) > CallExpression[callee.property.name='sort']:not([callee.object.type='CallExpression']):not([callee.object.type='ArrayExpression']):not([callee.object.name='mongoUtil'])",
                    message:
                        'Restricted Array Mutation: Use `array.slice().sort(...)` if mutation was not intended, otherwise place on own line.',
                },
                {
                    selector:
                        "*:not(ExpressionStatement) > CallExpression[callee.property.name='reverse']:not([callee.object.type='CallExpression']):not([callee.object.type='ArrayExpression'])",
                    message:
                        'Restricted Array Mutation: Use `array.slice().reverse(...)` if mutation was not intended, otherwise place on own line.',
                },
                {
                    selector: "*:not(ExpressionStatement) > CallExpression[callee.property.name='push']",
                    message:
                        'Restricted Array Mutation: `array.push(...)` returns push count, not array reference, place statement on own line.',
                },
            ],
            'no-undef': 'error',
            'no-unused-expressions': 'error',
            'no-unused-vars': ['error', { vars: 'all', args: 'none' }],
            'no-useless-escape': 'off',
            'no-with': 'error',
            'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'function' }],
            semi: ['error', 'always'],
            'space-before-blocks': ['error', 'always'],
        },
    },
];
