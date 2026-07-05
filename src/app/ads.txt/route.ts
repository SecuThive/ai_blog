import { NextResponse } from 'next/server';

export const revalidate = 86400;

/**
 * /ads.txt — 실제 AdSense publisher ID를 환경변수에서 읽어 생성한다.
 * 우선순위: ADSENSE_PUBLISHER_ID (예: pub-XXXXXXXXXXXXXXXX)
 *        → NEXT_PUBLIC_ADSENSE_ID (예: ca-pub-XXXXXXXXXXXXXXXX, 'ca-' 접두 제거)
 * 둘 다 없으면 가짜 ID를 노출하지 않고 404를 반환한다.
 * 설정 방법: Vercel → Settings → Environment Variables 에 위 변수 추가.
 */
export async function GET() {
  const raw =
    process.env.ADSENSE_PUBLISHER_ID ??
    process.env.NEXT_PUBLIC_ADSENSE_ID ??
    '';
  const pub = raw.replace(/^ca-/, '').trim();
  if (!/^pub-\d+$/.test(pub)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  return new NextResponse(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
