import type { NextRequest } from 'next/server';

// i18n 작업 보류 중 — pass-through만 수행
export default function proxy(_req: NextRequest) {
  return undefined;
}
