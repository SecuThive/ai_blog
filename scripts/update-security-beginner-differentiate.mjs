import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const newSummary =
  '새 서버를 받은 첫날, 깊이보다 빠짐없음이 중요합니다. SSH 키·UFW·fail2ban·자동 업데이트까지 8단계를 30분 안에 끝내는 초급 체크리스트 — 각 항목의 심화 설정은 별도 가이드에서 다룹니다.';

const appendedSection = `

---

## 다음 단계 — 각 항목 심화 가이드

이 가이드는 **빠짐없이 훑기**에 집중했습니다. 각 항목을 더 깊이 파고들려면 아래 가이드를 참고하세요.

| 주제 | 가이드 | 난이도 |
|---|---|---|
| SSH 키·포트·AllowUsers 완전 설정 | SSH 보안 강화 설정 완전 가이드 | 중급 |
| fail2ban jail 규칙·이메일 알림·Cloudflare 연동 | SSH 서버 보안 강화 — 설정 최적화와 fail2ban | 중급 |
| UFW 포트 범위·앱 프로파일·로깅 | UFW 방화벽 설정 완전 가이드 | 초급 |

> **이 가이드의 역할**: 서버를 처음 받았을 때 놓치는 항목이 없도록 하는 **출발점**입니다. 운영 환경에서는 위 심화 가이드를 반드시 추가로 적용하세요.`;

// 현재 content 읽어오기
const { data, error: fetchErr } = await supabase
  .from('engineer_guides')
  .select('content')
  .eq('slug', 'linux-server-initial-security-setup')
  .single();

if (fetchErr) {
  console.error('FETCH FAIL:', fetchErr.message);
  process.exit(1);
}

const updatedContent = data.content + appendedSection;

const { error } = await supabase
  .from('engineer_guides')
  .update({
    summary: newSummary,
    content: updatedContent,
  })
  .eq('slug', 'linux-server-initial-security-setup');

if (error) console.error('UPDATE FAIL:', error.message);
else console.log('OK: linux-server-initial-security-setup differentiated');
