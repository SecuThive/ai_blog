# stale-refresh SQL

글마다 운영 DB에 실제로 적용한 UPDATE 한 개 파일. 원문 content·content_evidence·tags의 md5 조건이 있어 이미 적용된 DB에서 다시 실행하면 0행이다.
KO가 바뀐 글은 contentUpdatedAt을 적용 시각(UTC)으로 넣고 updated_at은 트리거가 올린다. EN만 바뀐 글은 같은 트랜잭션의 두 번째 UPDATE로 updated_at을 원래 값으로 되돌린다(`../../stale-refresh.md` 참고).
원래 값 복원 SQL은 운영 머신의 `~/project/nodelog-db/backups/stale-refresh-20261004-0437-restore/`에 있다.
마일스톤 2 파일(배치 2와 `*-v2.sql`)의 복원 SQL은 `~/project/nodelog-db/backups/stale-refresh-20261004-044945-restore/`에 있다. `*-v2.sql`은 배치 1 적용 결과 위에 적용한다.
마일스톤 3 파일(배치 3과 `*-v3.sql`)의 복원 SQL은 `~/project/nodelog-db/backups/stale-refresh-20261004-045921-restore/`에 있다. `*-v3.sql`은 v2(또는 배치 1) 적용 결과 위에 적용한다.
배치 4(`734-csap-guide.sql`, `665-csap-simplified-grade-v2.sql`)의 복원 SQL은 `~/project/nodelog-db/backups/stale-refresh-20261004-051233-restore/`에 있다.
