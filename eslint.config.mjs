import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 이미 적용이 끝난 일회성 콘텐츠 삽입 스크립트. 본문 템플릿 리터럴 안에 이스케이프되지 않은 백틱이 있어
    // 파싱이 안 된다(main 41c19bf 이전부터). 빌드·런타임에서 쓰지 않으므로 린트 대상에서 뺀다.
    "scripts/insert-posts.ts",
    "scripts/insert-new-episodes.mjs",
  ]),
  // CommonJS 스크립트(postinstall의 apply-next-patch.cjs)는 require()가 정상 문법이다.
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
