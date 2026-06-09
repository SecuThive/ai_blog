import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nodelog — IT·개발·보안 테크 미디어',
    short_name: 'Nodelog',
    description: 'IT·개발·보안·인프라 실무 인사이트를 전문 에디터가 검증·큐레이션하는 테크 미디어',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0D14',
    theme_color: '#0A0D14',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  };
}
