import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const slugs = [
  'ssh-connection-troubleshoot',
  'nginx-502-bad-gateway-fix',
  'linux-disk-full-fix',
  'linux-port-in-use-fix',
];

const { error } = await supabase
  .from('engineer_guides')
  .update({ category: '트러블슈팅' })
  .in('slug', slugs);

if (error) console.error('FAIL:', error.message);
else console.log(`OK: ${slugs.length} guides → 트러블슈팅`);
