import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Nodelog — IT·개발·보안 테크 미디어';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0D14',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 700,
            height: 400,
            background: 'radial-gradient(circle at 80% 20%, rgba(110,159,255,0.12), transparent 60%)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7BB5FF, #5535D4)',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {/* Site name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#E8ECF4',
            letterSpacing: '-3px',
            marginBottom: 16,
          }}
        >
          NODELOG
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: '#7E879B',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            marginBottom: 48,
          }}
        >
          AI · IT · INSIGHTS
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 18,
            color: '#565E72',
            textAlign: 'center',
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          AI 초안과 사람의 편집 검토로 만드는 IT·개발·보안·인프라 실무 미디어
        </div>
      </div>
    ),
    { ...size }
  );
}
