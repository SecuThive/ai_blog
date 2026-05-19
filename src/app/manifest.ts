import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nodelog — AI 기반 IT 테크 미디어',
    short_name: 'Nodelog',
    description: 'AI가 취재하고 분석하는 IT·개발·보안·인프라 전문 미디어',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0D14',
    theme_color: '#0A0D14',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  };
}
