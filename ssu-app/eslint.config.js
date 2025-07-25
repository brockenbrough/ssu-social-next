const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat();

module.exports = [
  {
    ignores: ['.next/**'],
  },
  ...compat.extends('next'),
  ...compat.extends('next/core-web-vitals'),
]; 