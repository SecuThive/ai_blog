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
  | '취약점 관리'
  | '위협 인텔리전스';

export interface SecurityVendor {
  id: string;
  name: string;
  nameEn: string;
  categories: SecurityCategory[];
  products: string[];
  desc: string;
  descEn: string;
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
    descEn: 'Samsung SDS affiliate specializing in NGFW and UTM. Strong public-sector and finance references.',
    url: 'https://www.secui.com',
    founded: '2001',
  },
  {
    id: 'piolink',
    name: '파이오링크',
    nameEn: 'PIOLINK',
    categories: ['방화벽 / 네트워크', 'WAF / 웹 방화벽'],
    products: ['WEBFRONT-K', 'TiFRONT', 'PAS-K'],
    desc: '웹방화벽·보안 스위치·ADC를 제공하는 네트워크 보안 기업.',
    descEn: 'Network security vendor offering web application firewalls, security switches, and ADCs.',
    url: 'https://www.piolink.com',
    founded: '2000',
  },
  {
    id: 'wins',
    name: 'WINS',
    nameEn: 'WINS',
    categories: ['방화벽 / 네트워크'],
    products: ['SNIPER ONE', 'SNIPER UTM', 'SNIPER IPS'],
    desc: '네트워크 침입탐지·차단(IPS/IDS) 전문. SNIPER 시리즈 국내 공공 시장 점유.',
    descEn: 'Network IPS/IDS specialist. SNIPER series holds strong share in Korea\'s public sector.',
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
    descEn: 'Cloud WAF and SWG provider with SASE architecture support.',
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
    descEn: 'OT/ICS/CPS security specialist. IT–OT convergence solutions for smart factories and industrial environments.',
    url: 'https://www.naonworks.com',
    founded: '2002',
  },
  {
    id: 'genians',
    name: '지니언스',
    nameEn: 'Genians',
    categories: ['방화벽 / 네트워크', 'EDR / 엔드포인트'],
    products: ['Genian NAC', 'Genian EDR', 'Genian ZTNA'],
    desc: 'NAC·EDR·제로트러스트 접근제어 제품을 제공하는 기업.',
    descEn: 'Vendor offering NAC, EDR, and zero-trust access control products.',
    url: 'https://www.genians.com',
    founded: '2005',
  },
  {
    id: 'handreamnet',
    name: '한드림넷',
    nameEn: 'Handream Net',
    categories: ['방화벽 / 네트워크'],
    products: ['SubGate', 'VIPM'],
    desc: '보안 스위치·NAC·IP 관리 전문 네트워크 보안 기업. 공공·금융·기업 네트워크 접근제어 납품.',
    descEn: 'Security switches, NAC, and IP management specialist. Public, finance, and enterprise network access control.',
    url: 'https://www.handream.net',
    founded: '2000',
  },

  /* ─── EDR / 엔드포인트 ──────────────────────────────────── */
  {
    id: 'ahnlab',
    name: '안랩',
    nameEn: 'AhnLab',
    categories: ['EDR / 엔드포인트', '취약점 관리'],
    products: ['AhnLab V3', 'AhnLab EDR', 'AhnLab EPP', 'AhnLab MDS'],
    desc: '엔드포인트·네트워크·클라우드 보안 제품을 제공하는 기업.',
    descEn: 'Vendor offering endpoint, network, and cloud security products.',
    url: 'https://www.ahnlab.com',
    founded: '1995',
  },
  {
    id: 'estsecurity',
    name: '이스트시큐리티',
    nameEn: 'ESTsecurity',
    categories: ['EDR / 엔드포인트'],
    products: ['알약 EDR', '알약 기업용', 'ESRC 위협 인텔리전스'],
    desc: '알약 브랜드의 백신·EDR 제품과 위협 인텔리전스를 제공.',
    descEn: 'Offers Alyac antivirus and EDR products and threat intelligence.',
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
    descEn: 'ViRobot antivirus developer. Supplies endpoint security to public and financial institutions.',
    url: 'https://www.hauri.co.kr',
    founded: '1995',
  },
  {
    id: 'checkmal',
    name: '체크멀',
    nameEn: 'CHECKMAL',
    categories: ['EDR / 엔드포인트'],
    products: ['AppCheck', 'AppCheck Pro', 'AppCheck Pro for Windows Server'],
    desc: 'AppCheck 제품군을 제공하는 랜섬웨어 대응 기업.',
    descEn: 'Ransomware protection vendor offering the AppCheck product family.',
    url: 'https://www.checkmal.com',
    founded: '2013',
  },
  {
    id: 'nurilab',
    name: '누리랩',
    nameEn: 'Nurilab',
    categories: ['EDR / 엔드포인트'],
    products: ['Nuri Anti-Ransom', 'Lupe CDR', 'NESS'],
    desc: '랜섬웨어 대응·문서 무해화·이메일 보안 제품을 제공하는 기업.',
    descEn: 'Vendor offering ransomware protection, content disarm, and email security products.',
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
    descEn: 'Leading Korean SIEM vendor (formerly Igloo Security). AI threat analysis, XDR, and SOC automation.',
    url: 'https://www.igloo.co.kr',
    founded: '2000',
  },
  {
    id: 'logpresso',
    name: '로그프레소',
    nameEn: 'Logpresso',
    categories: ['SIEM / 보안관제'],
    products: ['Logpresso Sonar', 'Logpresso Maestro'],
    desc: '고성능 로그 분석 엔진 기반 SIEM·SOAR. 실시간 대용량 로그 처리에 강점.',
    descEn: 'High-performance log-analysis SIEM/SOAR. Strong at real-time high-volume log processing.',
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
    descEn: 'SK Group security affiliate. MSSP, physical security, and cloud security services.',
    url: 'https://www.skshieldus.com',
    founded: '1977',
  },
  {
    id: 'cyberwon',
    name: '싸이버원',
    nameEn: 'CyberOne',
    categories: ['SIEM / 보안관제'],
    products: ['PROM SIEM'],
    desc: '통합보안관제센터(SOC) 운영 및 SIEM 솔루션 전문 기업.',
    descEn: 'SOC operations and SIEM solutions specialist.',
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
    desc: 'WAPPLES 웹방화벽과 D’Amo 데이터 암호화 제품을 제공.',
    descEn: 'Offers the WAPPLES web application firewall and D’Amo data encryption products.',
    url: 'https://www.pentasecurity.co.kr',
    founded: '1997',
  },
  {
    id: 's2w',
    name: 'S2W',
    nameEn: 'S2W',
    categories: ['ASM / 공격표면관리', '위협 인텔리전스'],
    products: ['XARVIS', 'QUAXAR'],
    desc: 'AI 기반 사이버 위협 인텔리전스 및 다크웹 모니터링 전문 기업.',
    descEn: 'AI-powered cyber threat intelligence and dark-web monitoring specialist.',
    url: 'https://s2w.inc',
    founded: '2018',
  },

  /* ─── 웹쉘 탐지 ──────────────────────────────────────────── */
  {
    id: 'narusec',
    name: '나루씨큐리티',
    nameEn: 'NARUSEC',
    categories: ['웹쉘 탐지'],
    products: ['ZeroTiCA Lite', 'ConnecTome NDR'],
    desc: '웹·방화벽 로그 기반 침해 분석 서비스와 내부망 위협 탐지 솔루션 제공.',
    descEn: 'Offers web and firewall log investigation services and internal network threat detection.',
    url: 'https://www.narusec.com',
    founded: '2012',
  },
  {
    id: 'fasoo',
    name: '파수',
    nameEn: 'Fasoo',
    categories: ['DLP / 정보유출방지'],
    products: ['Wrapsody', 'Fasoo Enterprise DRM', 'Fasoo AI-R DLP'],
    desc: '문서 DRM·DLP 및 콘텐츠 관리 솔루션 제공 기업.',
    descEn: 'Provider of document DRM, DLP, and content management solutions.',
    url: 'https://www.fasoo.com',
    founded: '2000',
  },
  {
    id: 'umvtech',
    name: '유엠브이기술',
    nameEn: 'UMV Technology',
    categories: ['웹쉘 탐지'],
    products: ['쉘모니터'],
    desc: '웹쉘 탐지·차단 전문 솔루션. 공공기관 웹서버 보안 점검 다수 납품 이력.',
    descEn: 'Webshell detection and blocking specialist. Many public-sector web-server security engagements.',
    url: 'http://www.umv.co.kr',
    founded: '2007',
  },
  {
    id: 'ssr',
    name: 'SSR',
    nameEn: 'SSR',
    categories: ['취약점 관리'],
    products: ['SolidStep', 'MetiEye', '취약점 진단', '모의해킹'],
    desc: '서버·네트워크 장비 취약점 스캐닝·모의해킹 전문. SolidStep·MetiEye 자체 솔루션 보유.',
    descEn: 'Server and network vulnerability scanning and pen-testing specialist. SolidStep and MetiEye products.',
    url: 'https://www.ssrinc.co.kr',
    founded: '2006',
  },

  /* ─── ASM / 공격표면관리 ─────────────────────────────────── */
  {
    id: 'norma',
    name: '노르마',
    nameEn: 'NORMA',
    categories: ['ASM / 공격표면관리'],
    products: ['IoT Care'],
    desc: 'IoT 자산 식별과 취약점 분석 솔루션 제공 기업.',
    descEn: 'Vendor offering IoT asset discovery and vulnerability analysis.',
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
    descEn: 'Operates Criminal IP, a global cyber threat-intelligence platform for IP and domain lookups.',
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
    desc: '모바일 인증·FIDO 기반 인증 제품을 제공하는 기업.',
    descEn: 'Vendor offering mobile and FIDO-based authentication products.',
    url: 'https://www.raonsecure.com',
    founded: '2012',
  },
  {
    id: 'dreamsecurity',
    name: '드림시큐리티',
    nameEn: 'Dream Security',
    categories: ['MFA / 인증'],
    products: ['MagicLine4NX'],
    desc: '공인인증서·PKI 기반 인증 솔루션 전문. 전자서명·본인확인 시장 주요 공급사.',
    descEn: 'PKI and certificate-based auth specialist. Major supplier for e-signatures and identity verification.',
    url: 'https://www.dreamsecurity.com',
    founded: '2003',
  },
  {
    id: 'initech',
    name: '이니텍',
    nameEn: 'INITECH',
    categories: ['MFA / 인증'],
    products: ['INISAFE', 'INISAFE CrossWeb', 'eSign'],
    desc: 'INISAFE 제품군을 제공하는 전자금융 인증 기업.',
    descEn: 'Electronic-finance authentication vendor offering the INISAFE product family.',
    url: 'https://www.initech.com',
    founded: '1997',
  },
  {
    id: 'kica',
    name: '한국정보인증',
    nameEn: 'KICA',
    categories: ['MFA / 인증'],
    products: ['공동인증서', 'SignOK', 'KICASign+'],
    desc: '1999년 설립된 공인인증기관(CA). 공동인증서·전자서명·타임스탬프 서비스 제공.',
    descEn: 'Accredited CA founded in 1999. Joint certificates, e-signatures, and timestamp services.',
    url: 'https://www.signgate.com',
    founded: '1999',
  },
  {
    id: 'crosscert',
    name: '한국전자인증',
    nameEn: 'CrossCert',
    categories: ['MFA / 인증'],
    products: ['CrossCert 공동인증서', 'CrossSign', '전자서명 SDK'],
    desc: '국내 공인인증기관(CA) 중 하나. 금융·의료·공공 전자서명 및 인증서 발급.',
    descEn: 'One of Korea\'s accredited CAs. Certificates and e-signatures for finance, healthcare, and government.',
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
    descEn: 'DLP and media-control specialist. Many finance and public document-leak prevention references.',
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
    descEn: 'Email and network DLP specialist. Privacy-leak prevention for public and finance customers.',
    url: 'https://www.somansa.com',
    founded: '2000',
  },
  {
    id: 'jiransecurity',
    name: '지란지교시큐리티',
    nameEn: 'Jiran Security',
    categories: ['DLP / 정보유출방지'],
    products: ['SpamSniper', 'DocsFlow', 'SecuDrive USB'],
    desc: '이메일 보안과 문서·매체 보호 제품을 제공하는 기업.',
    descEn: 'Vendor offering email security and document and device protection products.',
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
    descEn: 'CDR-based document security and email isolation specialist. KOSDAQ-listed.',
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
    descEn: 'DB access control, audit, and encryption. Petra suite is CC-certified with finance/public references.',
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
    descEn: 'DBSAFER DB access-control and audit specialist. Expanding into cloud DB security.',
    url: 'https://www.pnpsecure.com',
    founded: '2008',
  },

  /* ─── 엔드포인트 보안 ───────────────────────────────────── */
  {
    id: 'saferzone',
    name: '세이퍼존',
    nameEn: 'SaferZone',
    categories: ['DLP / 정보유출방지', 'EDR / 엔드포인트'],
    products: ['All-In-One Endpoint Security', '보안 USB'],
    desc: '엔드포인트 DLP·매체제어·랜섬웨어 대응 제품 제공 기업.',
    descEn: 'Endpoint DLP, device control, and ransomware protection vendor.',
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
  '취약점 관리',
  '위협 인텔리전스',
];


export const CATEGORY_LABELS_EN: Record<SecurityCategory, string> = {
  '방화벽 / 네트워크': 'Firewall / Network',
  'EDR / 엔드포인트': 'EDR / Endpoint',
  'SIEM / 보안관제': 'SIEM / SOC',
  'WAF / 웹 방화벽': 'WAF / Web Firewall',
  '웹쉘 탐지': 'Webshell Detection',
  'ASM / 공격표면관리': 'ASM / Attack Surface',
  'MFA / 인증': 'MFA / Auth',
  'DLP / 정보유출방지': 'DLP / Data Loss Prevention',
  'DB / 데이터 보안': 'DB / Data Security',
  '취약점 관리': 'Vulnerability Management',
  '위협 인텔리전스': 'Threat Intelligence',
};

export function categoryLabel(cat: SecurityCategory, locale: string): string {
  if (locale === 'en') return CATEGORY_LABELS_EN[cat] ?? cat;
  return cat;
}

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
  '취약점 관리':         'rose',
  '위협 인텔리전스':     'blue',
};
