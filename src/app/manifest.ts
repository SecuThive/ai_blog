import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nodelog — IT·개발·보안 테크 미디어',
    short_name: 'Nodelog',
    description: '공식 문서와 기술 자료를 확인하고 지속적으로 업데이트하는 IT 실무 미디어',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0D14',
    theme_color: '#0A0D14',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    ],
  };
}
