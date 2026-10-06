import { NextResponse } from 'next/server';
import { adsensePublisherId } from '@/lib/adsense';

export const revalidate = 86400;

/**
 * /ads.txt — AdSense 로더와 같은 게시자 ID(src/lib/adsense.ts의 adsensePublisherId)로 생성한다.
 * NEXT_PUBLIC_ADSENSE_ID(ca-pub-…)가 형식에 맞으면 그 값, 아니면 기본 게시자 ID를 쓴다.
 * 예전의 별도 ADSENSE_PUBLISHER_ID 우선순위는 로더와 값이 갈라질 수 있어 없앴다(Vercel에도 설정되어 있지 않음).
 */
export async function GET() {
  return new NextResponse(`google.com, ${adsensePublisherId()}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
