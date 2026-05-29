import globals from 'globals'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'

export default [
    {
        ignores: ['dist', 'node_modules', '.git']
    },
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        plugins: {
            react: pluginReact,
            'react-hooks': pluginReactHooks
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn'
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    }
]
