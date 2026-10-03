# stale-refresh SQL

글마다 운영 DB에 실제로 적용한 UPDATE 한 개 파일. 원문 content·content_evidence·tags의 md5 조건이 있어 이미 적용된 DB에서 다시 실행하면 0행이다.
KO가 바뀐 글은 contentUpdatedAt을 적용 시각(UTC)으로 넣고 updated_at은 트리거가 올린다. EN만 바뀐 글은 같은 트랜잭션의 두 번째 UPDATE로 updated_at을 원래 값으로 되돌린다(`../../stale-refresh.md` 참고).
원래 값 복원 SQL은 운영 머신의 `~/project/nodelog-db/backups/stale-refresh-20261004-0437-restore/`에 있다.
