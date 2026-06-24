export type SecurityCategory =
  | '방화벽 / 네트워크'
  | 'EDR / 엔드포인트'
  | 'SIEM / 보안관제'
  | 'WAF / 웹 방화벽'
  | '웹쉘 탐지'
  | 'ASM / 공격표면관리'
  | 'MFA / 인증'
  | 'DLP / 정보유출방지'
  | 'DB / 데이터 보안'
  | 'VPN / 원격접근'
  | '취약점 관리';

export interface SecurityVendor {
  id: string;
  name: string;
  nameEn: string;
  categories: SecurityCategory[];
  products: string[];
  desc: string;
  url: string;
  founded: string;
}

export const VENDORS: SecurityVendor[] = [
  /* ─── 방화벽 / 네트워크 ─────────────────────────────────── */
  {
    id: 'secui',
    name: '시큐아이',
    nameEn: 'SECUI',
    categories: ['방화벽 / 네트워크'],
    products: ['SECUI MF2', 'SECUI NXG', 'SECUI UTM'],
    desc: '삼성SDS 계열 NGFW·UTM 전문 기업. 대형 공공·금융 레퍼런스 다수.',
    url: 'https://www.secui.com',
    founded: '2001',
  },
  {
    id: 'piolink',
    name: '파이오링크',
    nameEn: 'PIOLINK',
    categories: ['방화벽 / 네트워크', 'WAF / 웹 방화벽'],
    products: ['PLOS FW', 'WebFront-K', 'TiFRONT'],
    desc: '네트워크 보안 장비 및 ADC 전문 기업. L4/L7 스위칭·방화벽 통합 포트폴리오.',
    url: 'https://www.piolink.com',
    founded: '2000',
  },
  {
    id: 'wins',
    name: 'WINS',
    nameEn: 'WINS',
    categories: ['방화벽 / 네트워크', 'VPN / 원격접근'],
    products: ['SNIPER ONE', 'SNIPER UTM', 'SNIPER IPS'],
    desc: '네트워크 침입탐지·차단(IPS/IDS) 전문. SNIPER 시리즈 국내 공공 시장 점유.',
    url: 'https://www.wins21.com',
    founded: '1999',
  },
  {
    id: 'monitorapp',
    name: '모니터랩',
    nameEn: 'MONITORAPP',
    categories: ['방화벽 / 네트워크', 'WAF / 웹 방화벽'],
    products: ['AIONCLOUD WAF', 'AIONCLOUD SWG', 'AIWA'],
    desc: '클라우드 기반 WAF·SWG 제공. SASE 아키텍처 지원.',
    url: 'https://www.monitorapp.com',
    founded: '2005',
  },
  {
    id: 'neoautus',
    name: '나온웍스',
    nameEn: 'NaonWorks',
    categories: ['방화벽 / 네트워크', 'ASM / 공격표면관리'],
    products: ['CEREBRO-XTD (OT 가시성)', 'CEREBRO-DD (단방향 전송)', 'CEREBRO-Edge', 'VIPER-N (VoIP 보안)'],
    desc: 'OT/ICS/CPS 보안 전문 기업. 스마트팩토리·자율주행 등 산업 환경의 IT·OT 융합 보안 솔루션.',
    url: 'https://www.naonworks.com',
    founded: '2002',
  },
  {
    id: 'genians',
    name: '지니언스',
    nameEn: 'Genians',
    categories: ['방화벽 / 네트워크', 'EDR / 엔드포인트'],
    products: ['Genian NAC', 'Genian EDR', 'Genian ZTNA'],
    desc: '국내 NAC 시장 1위 코스닥 상장사. 엔드포인트 가시성·제로트러스트 접근제어.',
    url: 'https://www.genians.com',
    founded: '2005',
  },
  {
    id: 'handreamnet',
    name: '한드림넷',
    nameEn: 'Handream Net',
    categories: ['방화벽 / 네트워크'],
    products: ['SubGate (보안스위치)', 'NAC', 'IP관리 솔루션'],
    desc: '보안 스위치·NAC·IP 관리 전문 네트워크 보안 기업. 공공·금융·기업 네트워크 접근제어 납품.',
    url: 'https://www.handream.net',
    founded: '2000',
  },
  {
    id: 'sysmate',
    name: '시스메이트',
    nameEn: 'SysMate',
    categories: ['방화벽 / 네트워크'],
    products: ['SysMate IPS', 'SysMate UTM', 'SysMate DDoS'],
    desc: '네트워크 침입방지·DDoS 차단 장비 전문 중소 벤더. CC·GS인증 보유.',
    url: 'https://www.sysmate.co.kr',
    founded: '2003',
  },

  /* ─── EDR / 엔드포인트 ──────────────────────────────────── */
  {
    id: 'ahnlab',
    name: '안랩',
    nameEn: 'AhnLab',
    categories: ['EDR / 엔드포인트', '취약점 관리'],
    products: ['AhnLab V3', 'AhnLab EDR', 'AhnLab EPP', 'AhnLab MDS'],
    desc: '국내 1위 보안 소프트웨어 기업. 엔드포인트·네트워크·클라우드 통합 보안 플랫폼.',
    url: 'https://www.ahnlab.com',
    founded: '1995',
  },
  {
    id: 'estsecurity',
    name: '이스트시큐리티',
    nameEn: 'ESTsecurity',
    categories: ['EDR / 엔드포인트'],
    products: ['알약 EDR', '알약 기업용', 'ESRC 위협 인텔리전스'],
    desc: '알약 브랜드로 국내 PC 백신 시장 선두. 위협 인텔리전스 연구로도 유명.',
    url: 'https://www.estsecurity.com',
    founded: '2000',
  },
  {
    id: 'hauri',
    name: '하우리',
    nameEn: 'HAURI',
    categories: ['EDR / 엔드포인트'],
    products: ['ViRobot EDR', 'ViRobot APT-X', 'ViRobot Desktop'],
    desc: '바이로봇 백신 개발사. 공공·금융기관 엔드포인트 보안 공급.',
    url: 'https://www.hauri.co.kr',
    founded: '1995',
  },
  {
    id: 'checkmal',
    name: '체크멀',
    nameEn: 'CHECKMAL',
    categories: ['EDR / 엔드포인트'],
    products: ['MDS', 'APT-SHIELD', 'AppCheck'],
    desc: '랜섬웨어·APT 행위 기반 탐지 전문. 체크포인트 OEM 공급 이력.',
    url: 'https://www.checkmal.com',
    founded: '2013',
  },
  {
    id: 'nurilab',
    name: '누리랩',
    nameEn: 'Nurilab',
    categories: ['EDR / 엔드포인트'],
    products: ['CAVE (악성코드 분석)', 'Nurilab EDR', 'Threat Intelligence'],
    desc: '악성코드 자동 분석 SaaS 플랫폼 CAVE 운영. 위협 인텔리전스·EDR 신흥 강자.',
    url: 'https://www.nurilab.com',
    founded: '2018',
  },

  /* ─── SIEM / 보안관제 ───────────────────────────────────── */
  {
    id: 'igloosec',
    name: '이글루코퍼레이션',
    nameEn: 'IGLOO Corporation',
    categories: ['SIEM / 보안관제'],
    products: ['SPiDER TM AI Edition', 'IGLOO SIEM', 'IGLOO XDR', 'IGLOO SOAR'],
    desc: '국내 SIEM 시장 선도 기업(구 이글루시큐리티). AI 기반 위협 분석·XDR·SOC 자동화 플랫폼 보유.',
    url: 'https://www.igloo.co.kr',
    founded: '2000',
  },
  {
    id: 'logpresso',
    name: '로그프레소',
    nameEn: 'Logpresso',
    categories: ['SIEM / 보안관제'],
    products: ['Logpresso SIEM', 'Logpresso EDR', 'Logpresso SOAR'],
    desc: '고성능 로그 분석 엔진 기반 SIEM·SOAR. 실시간 대용량 로그 처리에 강점.',
    url: 'https://www.logpresso.com',
    founded: '2014',
  },
  {
    id: 'skshielder',
    name: 'SK쉴더스',
    nameEn: 'SK Shieldus',
    categories: ['SIEM / 보안관제'],
    products: ['Secudium', 'ADT Caps', 'MDR 서비스'],
    desc: 'SK그룹 보안 계열사. MSSP·물리 보안·클라우드 보안 종합 서비스.',
    url: 'https://www.skshieldus.com',
    founded: '1977',
  },
  {
    id: 'cyberwon',
    name: '싸이버원',
    nameEn: 'CyberOne',
    categories: ['SIEM / 보안관제'],
    products: ['ONE-SIGHT SIEM', 'SecuX SOAR'],
    desc: '통합보안관제센터(SOC) 운영 및 SIEM 솔루션 전문 기업.',
    url: 'https://www.cyberone.kr',
    founded: '2004',
  },

  /* ─── WAF / 웹 방화벽 ───────────────────────────────────── */
  {
    id: 'pentasecurity',
    name: '펜타시큐리티',
    nameEn: 'Penta Security',
    categories: ['WAF / 웹 방화벽', 'DB / 데이터 보안'],
    products: ['WAPPLES', 'WAPPLES SA', "D'Amo (DB암호화)"],
    desc: '국내 WAF 1위 기업. WAPPLES는 CC인증 획득. DB암호화 솔루션도 주요 제품.',
    url: 'https://www.pentasecurity.co.kr',
    founded: '1997',
  },
  {
    id: 's2w',
    name: 'S2W',
    nameEn: 'S2W',
    categories: ['WAF / 웹 방화벽', 'SIEM / 보안관제'],
    products: ['Xarvis', 'Talon', 'QUAXAR'],
    desc: 'AI 기반 사이버 위협 인텔리전스 및 다크웹 모니터링 전문 기업.',
    url: 'https://s2w.inc',
    founded: '2018',
  },
  {
    id: 'f1security',
    name: '에프원시큐리티',
    nameEn: 'F1 Security',
    categories: ['WAF / 웹 방화벽', '취약점 관리'],
    products: ['AppScan', 'F1-WAF', '웹 취약점 진단 서비스', '모의해킹'],
    desc: '웹 애플리케이션 취약점 진단·WAF 전문 중소 벤더. 클라우드 SaaS 형태 제공.',
    url: 'https://www.f1security.co.kr',
    founded: '2012',
  },

  /* ─── 웹쉘 탐지 ──────────────────────────────────────────── */
  {
    id: 'narusec',
    name: '나루씨큐리티',
    nameEn: 'NARUSEC',
    categories: ['웹쉘 탐지'],
    products: ['WebShell Detector', 'HackAware'],
    desc: '웹쉘 탐지·차단 전문 솔루션. 행위 기반 제로데이 웹쉘 탐지 특화.',
    url: 'https://www.narusec.com',
    founded: '2012',
  },
  {
    id: 'fasoo',
    name: '파수',
    nameEn: 'Fasoo',
    categories: ['웹쉘 탐지', 'DLP / 정보유출방지'],
    products: ['Wrapsody', 'Fasoo DRM', 'Fasoo RiskView'],
    desc: '문서 DRM·DLP 시장 리더. 웹쉘 탐지 및 데이터 보안 통합 솔루션.',
    url: 'https://www.fasoo.com',
    founded: '2000',
  },
  {
    id: 'umvtech',
    name: '유엠브이기술',
    nameEn: 'UMV Technology',
    categories: ['웹쉘 탐지'],
    products: ['쉘모니터', 'UMV WebGuard'],
    desc: '웹쉘 탐지·차단 전문 솔루션. 공공기관 웹서버 보안 점검 다수 납품 이력.',
    url: 'http://www.umv.co.kr',
    founded: '2007',
  },
  {
    id: 'ssr',
    name: 'SSR',
    nameEn: 'SSR',
    categories: ['취약점 관리', '웹쉘 탐지'],
    products: ['SolidStep', 'MetiEye', '취약점 진단', '모의해킹'],
    desc: '서버·네트워크 장비 취약점 스캐닝·모의해킹 전문. SolidStep·MetiEye 자체 솔루션 보유.',
    url: 'https://www.ssrinc.co.kr',
    founded: '2006',
  },

  /* ─── ASM / 공격표면관리 ─────────────────────────────────── */
  {
    id: 'norma',
    name: '노르마',
    nameEn: 'NORMA',
    categories: ['ASM / 공격표면관리'],
    products: ['Norma IoT Inspector', 'Norma ASM'],
    desc: 'IoT 기기 취약점 탐지 및 공격표면 관리 솔루션. KT 계열.',
    url: 'https://www.norma.co.kr',
    founded: '2014',
  },
  {
    id: 'aisecurity',
    name: 'AI스페라',
    nameEn: 'AI Spera',
    categories: ['ASM / 공격표면관리', '취약점 관리'],
    products: ['Criminal IP', 'Criminal IP ASM'],
    desc: '글로벌 사이버 위협 인텔리전스 플랫폼 Criminal IP 운영. IP·도메인 위협 조회.',
    url: 'https://www.aispera.com',
    founded: '2021',
  },

  /* ─── MFA / 인증 ────────────────────────────────────────── */
  {
    id: 'raonsecure',
    name: '라온시큐어',
    nameEn: 'RaonSecure',
    categories: ['MFA / 인증'],
    products: ['TouchEn mOTP', 'FIDO2 솔루션', 'TouchEn OnePass'],
    desc: '모바일 인증·FIDO 전문 기업. 공공·금융 MFA 시장 1위.',
    url: 'https://www.raonsecure.com',
    founded: '2012',
  },
  {
    id: 'dreamsecurity',
    name: '드림시큐리티',
    nameEn: 'Dream Security',
    categories: ['MFA / 인증', 'VPN / 원격접근'],
    products: ['MagicLine4NX', 'MagicINFO', 'PKI 솔루션'],
    desc: '공인인증서·PKI 기반 인증 솔루션 전문. 전자서명·본인확인 시장 주요 공급사.',
    url: 'https://www.dreamsecurity.com',
    founded: '2003',
  },
  {
    id: 'initech',
    name: '이니텍',
    nameEn: 'INITECH',
    categories: ['MFA / 인증'],
    products: ['INISAFE', 'INISAFE CrossWeb', 'eSign'],
    desc: 'INISAFE 플러그인으로 국내 전자금융 인증 시장 사실상 표준 구축.',
    url: 'https://www.initech.com',
    founded: '1997',
  },
  {
    id: 'kica',
    name: '한국정보인증',
    nameEn: 'KICA',
    categories: ['MFA / 인증'],
    products: ['SignKorea', 'KICA 공동인증서', 'KICA 전자서명 API'],
    desc: '1999년 설립된 공인인증기관(CA). 공동인증서·전자서명·타임스탬프 서비스 제공.',
    url: 'https://www.signkorea.com',
    founded: '1999',
  },
  {
    id: 'crosscert',
    name: '한국전자인증',
    nameEn: 'CrossCert',
    categories: ['MFA / 인증'],
    products: ['CrossCert 공동인증서', 'CrossSign', '전자서명 SDK'],
    desc: '국내 공인인증기관(CA) 중 하나. 금융·의료·공공 전자서명 및 인증서 발급.',
    url: 'https://www.crosscert.com',
    founded: '1999',
  },

  /* ─── DLP / 정보유출방지 ─────────────────────────────────── */
  {
    id: 'drsoft',
    name: '닥터소프트',
    nameEn: 'DoctorSoft',
    categories: ['DLP / 정보유출방지'],
    products: ['SOUL DLP', 'SOUL USB', 'SOUL 프린트'],
    desc: 'DLP·매체제어 솔루션 전문. 금융·공공 기관 문서 유출방지 레퍼런스 다수.',
    url: 'https://www.drsoft.co.kr',
    founded: '2001',
  },
  {
    id: 'somansa',
    name: '소만사',
    nameEn: 'Somansa',
    categories: ['DLP / 정보유출방지'],
    products: ['Mail-i (이메일 DLP)', 'Privacy-i (네트워크 DLP)', 'PCI DSS 솔루션'],
    desc: '이메일·네트워크 DLP 전문 기업. 개인정보 유출방지 솔루션 공공·금융 다수 납품.',
    url: 'https://www.somansa.com',
    founded: '2000',
  },
  {
    id: 'jiransecurity',
    name: '지란지교시큐리티',
    nameEn: 'Jiran Security',
    categories: ['DLP / 정보유출방지'],
    products: ['SpamSniper', 'DocsFlow', 'SecuDrive USB'],
    desc: '이메일 보안·스팸 차단 국내 1위. 문서 DLP 및 보안 USB 통합 포트폴리오.',
    url: 'https://www.jiransecurity.com',
    founded: '2000',
  },
  {
    id: 'softcamp',
    name: '소프트캠프',
    nameEn: 'SoftCamp',
    categories: ['DLP / 정보유출방지'],
    products: ['SHIELDEX (CDR)', 'Secure Email', 'Secure DRM', 'Secure ZTNA'],
    desc: '콘텐츠 무해화(CDR) 기술 기반 문서 보안·이메일 격리 전문. 코스닥 상장.',
    url: 'https://www.softcamp.co.kr',
    founded: '2000',
  },

  /* ─── DB / 데이터 보안 ───────────────────────────────────── */
  {
    id: 'sinsiway',
    name: '신시웨이',
    nameEn: 'SINSIWAY',
    categories: ['DB / 데이터 보안'],
    products: ['Petra (DB 접근제어)', 'Petra Audit', 'Petra Encrypt'],
    desc: 'DB 접근제어·감사·암호화 전문. Petra 제품군은 CC인증 획득, 금융·공공 레퍼런스 다수.',
    url: 'https://www.sinsiway.com',
    founded: '2001',
  },
  {
    id: 'pnpsecure',
    name: '피앤피시큐어',
    nameEn: 'PnP Secure',
    categories: ['DB / 데이터 보안'],
    products: ['DBSAFER', 'DBSAFER for Cloud', 'DBSAFER Audit'],
    desc: 'DB 접근제어·감사 솔루션 DBSAFER 전문. 클라우드 환경 DB 보안으로 사업 확대 중.',
    url: 'https://www.pnpsecure.com',
    founded: '2008',
  },

  /* ─── VPN / 원격접근 ────────────────────────────────────── */
  {
    id: 'saferzone',
    name: '세이퍼존',
    nameEn: 'SaferZone',
    categories: ['VPN / 원격접근'],
    products: ['CHAKRA Max', 'CHAKRA VPN', 'Zero Trust NAC'],
    desc: '제로트러스트 네트워크 접근제어(ZTNA)·SSL VPN 전문 기업.',
    url: 'https://www.saferzone.com',
    founded: '2001',
  },

];

export const CATEGORIES: SecurityCategory[] = [
  '방화벽 / 네트워크',
  'EDR / 엔드포인트',
  'SIEM / 보안관제',
  'WAF / 웹 방화벽',
  '웹쉘 탐지',
  'ASM / 공격표면관리',
  'MFA / 인증',
  'DLP / 정보유출방지',
  'DB / 데이터 보안',
  'VPN / 원격접근',
  '취약점 관리',
];

export const CATEGORY_TONE: Record<SecurityCategory, string> = {
  '방화벽 / 네트워크':   'blue',
  'EDR / 엔드포인트':    'rose',
  'SIEM / 보안관제':     'purple',
  'WAF / 웹 방화벽':     'mint',
  '웹쉘 탐지':           'amber',
  'ASM / 공격표면관리':  'blue',
  'MFA / 인증':          'mint',
  'DLP / 정보유출방지':  'amber',
  'DB / 데이터 보안':    'purple',
  'VPN / 원격접근':      'rose',
  '취약점 관리':         'rose',
};
