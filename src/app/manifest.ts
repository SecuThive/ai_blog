import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nodelog — IT·개발·보안 테크 미디어',
    short_name: 'Nodelog',
    description: 'AI 초안과 사람의 편집 검토를 거쳐 발행하는 IT·개발·보안·인프라 실무 미디어',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0D14',
    theme_color: '#0A0D14',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  };
}
