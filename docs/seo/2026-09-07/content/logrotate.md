## logrotate 란?

서버를 오래 돌리면 `/var/log` 아래 로그 파일이 끝없이 커집니다. 방치하면 디스크가 가득 차 서비스가 멈추고, 수 GB짜리 단일 로그는 검색조차 어렵습니다. **logrotate**는 이 문제를 자동화하는 표준 도구로, 정해진 주기나 크기마다 로그를 새 파일로 **순환(rotate)** 하고, 오래된 것은 **압축·삭제**합니다.

순환의 기본 개념은 다음과 같습니다.

```
app.log         ← 현재 기록 중
app.log.1       ← 직전 분량
app.log.2.gz    ← 더 오래된 것 (압축됨)
app.log.3.gz
...
```

새 파일이 생기면 번호가 하나씩 밀리고, 보관 한도를 넘은 가장 오래된 파일은 삭제됩니다.

---

## 동작 방식과 실행 주기

logrotate는 데몬이 아니라, **cron 또는 systemd 타이머가 하루 한 번 실행**하는 일회성 명령입니다.

| 배포판 | 트리거 |
|---|---|
| 전통적 | `/etc/cron.daily/logrotate` |
| systemd 기반 | `logrotate.timer` → `logrotate.service` |

```bash
# systemd 타이머 확인
systemctl list-timers logrotate.timer
systemctl status logrotate.timer
```

설정 진입점은 `/etc/logrotate.conf`이며, 이 파일이 마지막에 `include /etc/logrotate.d`로 개별 설정 디렉터리를 읽어들입니다. **패키지나 애플리케이션별 설정은 `/etc/logrotate.d/` 안에 파일로 두는 것이 표준**입니다.

---

## 전역 기본값 — /etc/logrotate.conf

```
# 주 단위 순환
weekly

# 4개 보관 (약 4주치)
rotate 4

# 순환 후 빈 새 로그 파일 생성
create

# 순환 파일에 날짜 확장자 사용 (app.log-20260618)
dateext

# 순환된 파일 압축
compress

# 개별 설정 포함
include /etc/logrotate.d
```

`/etc/logrotate.d`의 개별 설정에서 같은 지시어를 다시 쓰면 전역값을 **덮어씁니다.**

---

## 개별 설정 작성 — /etc/logrotate.d/myapp

웹 애플리케이션 로그를 예로 든 실전 설정입니다.

```
/var/log/myapp/*.log {
    daily
    rotate 14
    missingok
    notifempty
    compress
    delaycompress
    dateext
    create 0640 appuser appgroup
    sharedscripts
    postrotate
        systemctl reload myapp >/dev/null 2>&1 || true
    endscript
}
```

각 지시어의 의미:

| 지시어 | 역할 |
|---|---|
| `daily` / `weekly` / `monthly` | 순환 주기 |
| `rotate 14` | 14개까지 보관 후 삭제 |
| `missingok` | 로그 파일이 없어도 오류 없이 넘어감 |
| `notifempty` | 비어 있으면 순환하지 않음 |
| `compress` | 순환 파일을 gzip 압축 |
| `delaycompress` | 가장 최근 순환본은 압축을 한 주기 미룸 |
| `dateext` | 번호 대신 날짜를 확장자로 |
| `create 0640 user group` | 새 로그를 지정 권한/소유자로 생성 |
| `sharedscripts` | 와일드카드 매칭 파일 전체에 스크립트 1회만 실행 |
| `postrotate ... endscript` | 순환 직후 실행할 명령 |

---

순환된 `.gz` 로그를 직접 풀거나 여러 로그를 묶어 전달할 때는 [리눅스 tar·gzip·zstd 압축 해제 명령표](/engineer/linux-archive-compress-guide)를 참고하세요.

## 크기 기반 순환

시간이 아니라 **크기**로 자르고 싶을 때 사용합니다.

```
/var/log/nginx/access.log {
    size 100M
    rotate 10
    compress
    missingok
    create 0640 www-data adm
    postrotate
        # nginx에 새 로그 파일을 열라고 신호
        [ -f /run/nginx.pid ] && kill -USR1 $(cat /run/nginx.pid)
    endscript
}
```

| 지시어 | 의미 |
|---|---|
| `size 100M` | 100MB를 넘으면 순환(주기 무관, 매 실행 시 크기 검사) |
| `maxsize 100M` | 주기 도래 전이라도 이 크기 넘으면 순환 |
| `minsize 10M` | 주기가 됐어도 이 크기 미만이면 순환 안 함 |

> `size`만 쓰면 `daily`/`weekly` 같은 시간 조건을 **무시**합니다. "주마다 또는 100MB 넘으면"을 원하면 `weekly` + `maxsize 100M`를 함께 쓰세요.

---

## create 방식 vs copytruncate 방식

순환의 가장 중요한 두 전략입니다. 애플리케이션이 로그 파일을 다루는 방식에 따라 골라야 합니다.

| 방식 | 동작 | 적합한 경우 |
|---|---|---|
| `create` (기본) | 기존 파일을 `mv`로 옮기고 새 파일 생성 | 앱이 `postrotate`에서 reopen 신호(SIGHUP 등)를 받을 수 있을 때 |
| `copytruncate` | 원본을 복사한 뒤 원본을 0바이트로 truncate | 앱을 재시작/신호 처리할 수 없고 파일 핸들을 계속 잡고 있을 때 |

```
/var/log/legacy-app/output.log {
    daily
    rotate 7
    compress
    copytruncate
}
```

> `create` 방식인데 앱에 reopen 신호를 보내지 않으면, 앱은 `mv`로 옮겨진(이미 이름이 바뀐) **옛 파일 핸들에 계속 기록**합니다. 그 결과 새 `app.log`는 비어 있고 디스크는 줄지 않습니다. 신호를 못 보내는 앱이라면 `copytruncate`를 쓰되, 복사~truncate 사이 짧은 순간에 기록된 로그는 유실될 수 있다는 점을 감안하세요.

---

## prerotate / postrotate 스크립트

순환 전후로 명령을 실행합니다. 서비스에 새 파일을 열도록 신호를 보내는 데 주로 씁니다.

```
postrotate
    # systemd 서비스 reload
    systemctl reload rsyslog >/dev/null 2>&1 || true
endscript
```

`sharedscripts`가 없으면 와일드카드로 매칭된 **파일마다** 스크립트가 반복 실행됩니다. 서비스 reload는 보통 한 번이면 되므로 `sharedscripts`를 함께 쓰는 것이 일반적입니다.

---

## 테스트와 디버깅

설정을 바꾸면 실제 cron을 기다리지 말고 즉시 검증하세요.

```bash
# 1) 무엇이 일어날지 보기만 함 (실제 순환 X) — 가장 자주 씀
logrotate --debug /etc/logrotate.d/myapp

# 2) 강제로 지금 순환 (주기/크기 조건 무시)
sudo logrotate --force /etc/logrotate.d/myapp

# 3) 전체 설정 강제 실행
sudo logrotate --force /etc/logrotate.conf

# 4) 마지막 순환 시각 기록 확인
cat /var/lib/logrotate/logrotate.status
```

> `--debug`는 `--verbose`를 포함하면서 **아무 것도 실제로 바꾸지 않습니다.** 운영 서버에서 설정을 확인할 때 안전한 첫 단계입니다. 실제 동작이 안 될 때는 `status` 파일에서 해당 로그의 마지막 순환 날짜가 갱신됐는지 확인하세요.

---

## 자주 겪는 문제

| 증상 | 원인 / 해결 |
|---|---|
| 순환은 됐는데 디스크가 안 줄어듦 | `create` 방식 + reopen 신호 누락 → `copytruncate` 또는 `postrotate` 신호 추가 |
| 권한 오류로 새 로그 생성 실패 | `create` 권한·소유자 지정, 상위 디렉터리 권한 확인 |
| 설정이 무시됨 | `/etc/logrotate.d/` 파일에 실행권한·확장자 문제 또는 `.conf`에 미포함. 파일명에 `.`(점) 주의 |
| "skipping ... because parent directory has insecure permissions" | `su user group` 지시어 추가하거나 디렉터리 권한 교정 |
| 압축 파일이 1개 부족 | `delaycompress` 때문(가장 최근본은 다음 주기에 압축) — 정상 동작 |

---

## 정리

| 항목 | 핵심 |
|---|---|
| 실행 주체 | cron.daily 또는 `logrotate.timer` (데몬 아님) |
| 설정 위치 | 전역 `/etc/logrotate.conf`, 개별 `/etc/logrotate.d/` |
| 주기 | `daily`/`weekly`/`monthly` 또는 `size`/`maxsize` |
| 보관 개수 | `rotate N` |
| 압축 | `compress` + `delaycompress` |
| 새 파일 처리 | `create`(신호 필요) vs `copytruncate`(신호 불가 앱) |
| 후처리 | `postrotate ... endscript` + `sharedscripts` |
| 검증 | `logrotate --debug`, `--force` |

logrotate는 거의 모든 리눅스 서버에 기본 탑재된 만큼, 새 서비스를 배포할 때 `/etc/logrotate.d/`에 설정 한 장을 함께 넣는 습관을 들이면 디스크 풀로 인한 장애를 근본적으로 예방할 수 있습니다.
