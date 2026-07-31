-- Nodelog 콘텐츠 품질 워크플로 및 날짜 신뢰성 보강
-- 기존 공개 URL과 게시 상태는 변경하지 않는다.

alter table posts
  alter column status set default 'draft',
  add column if not exists updated_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text,
  add column if not exists content_evidence jsonb;

-- 과거 글에 허위 수정일을 만들지 않고 기존 게시일을 기준값으로 보존한다.
update posts
set updated_at = coalesce(published_at, created_at)
where updated_at is null;

create or replace function set_post_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  if row(
    new.title,
    new.content,
    new.excerpt,
    new.cover_image,
    new.category,
    new.tags,
    new.content_evidence
  ) is distinct from row(
    old.title,
    old.content,
    old.excerpt,
    old.cover_image,
    old.category,
    old.tags,
    old.content_evidence
  ) then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_content_updated_at on posts;
create trigger posts_set_content_updated_at
before update on posts
for each row
execute function set_post_content_updated_at();

comment on column posts.updated_at is
  '본문 또는 주요 콘텐츠 필드가 실제 변경된 시각. 단순 조회수/빌드로 변경하지 않는다.';
comment on column posts.reviewed_at is
  '사람 검토자가 공개를 승인한 시각.';
comment on column posts.reviewed_by is
  '실제 승인 책임자의 이름 또는 고정 필명. 자동 생성 값 금지.';
comment on column posts.content_evidence is
  '실제 데이터가 있을 때만 사용하는 선택형 테스트 환경·검증 결과·공식 출처.';
