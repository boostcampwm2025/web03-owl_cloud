import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  // ESLint 기본 추천 규칙 (eslint:recommended)
  js.configs.recommended,

  // Next.js Core Web Vitals 규칙
  ...nextVitals,

  // Next.js + TypeScript 규칙
  ...nextTs,

  // Prettier와 충돌하는 ESLint 규칙 비활성화
  prettier,

  // 커스텀 룰 & ignore 설정
  {
    rules: {
      'no-console': 'warn',
    },
  },

  // Next.js 기본 ignore 유지 + 명시적 선언
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
