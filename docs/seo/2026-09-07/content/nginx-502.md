Nginx의 **502 Bad Gateway는 프록시가 upstream에서 유효한 응답을 받지 못했다는 뜻**입니다. 먼저 같은 시각의 `error.log`와 실제 `proxy_pass` 대상을 대조하세요. 앱이 꺼져 있는지, 주소가 다른지, 소켓 접근이 거부됐는지에 따라 수정할 곳이 달라집니다.

아래 명령은 Linux의 Nginx reverse proxy를 기준으로 합니다. 컨테이너에서는 명령을 실행하는 위치도 확인해야 합니다. Nginx 컨테이너의 `127.0.0.1`은 다른 앱 컨테이너가 아닌 Nginx 컨테이너 자신입니다.

## 502 Bad Gateway 원인별 로그 판정표

| error.log의 핵심 문자열 | 우선 의심할 원인 | 다음 확인 |
|---|---|---|
| `connect() failed (111: Connection refused)` | 해당 주소·포트에 앱이 리슨하지 않음, 연결 거부 | `ss -ltnp`, 앱 서비스 상태, `proxy_pass` |
| `connect() to unix:... failed (2: No such file or directory)` | PHP-FPM 등의 소켓 경로 불일치 또는 미생성 | `fastcgi_pass`와 FPM `listen` 비교 |
| `connect() ... failed (13: Permission denied)` | 소켓·상위 디렉터리 권한 또는 보안 정책 | 워커 사용자, 경로 권한, SELinux/AppArmor 로그 |
| `upstream prematurely closed connection` | 앱이 헤더를 보내기 전에 연결 종료 | 앱 예외·재시작·OOM 기록 |
| `upstream sent too big header` | upstream 응답 헤더가 버퍼보다 큼 | 쿠키·인증 헤더 크기, proxy/FastCGI 버퍼 |
| `no live upstreams` | 선택할 수 있는 upstream이 없음 | upstream 구성, 직전 연결 실패 로그 |

이 표는 진단 출발점입니다. 같은 에러도 프록시 재시도와 앞단 CDN에 따라 최종 상태 코드가 달라질 수 있습니다. Nginx는 연결 오류·타임아웃·잘못된 응답 헤더를 구분해 upstream 재시도를 처리합니다. [Nginx proxy_next_upstream 문서](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_next_upstream)

## 1. 요청 시각과 upstream 주소부터 맞추기

```bash
# Nginx 서버에서 실행: 경로는 실제 error_log 설정에 맞춥니다.
sudo tail -n 80 /var/log/nginx/error.log
sudo nginx -T 2>&1 | grep -nE 'upstream|proxy_pass|fastcgi_pass|uwsgi_pass|error_log'
sudo ss -ltnp
```

`nginx -T`는 적용할 설정 전체를 출력합니다. 외부에 공유할 때 설정에 포함된 비밀값을 제거하세요. 로그의 `upstream:` 주소와 리슨 포트가 일치해야 합니다.

HTTP upstream이라면 **Nginx와 같은 서버·컨테이너에서** 직접 요청합니다. 아래 주소는 실제 설정으로 바꾸세요.

```bash
curl -sv --connect-timeout 3 --max-time 10 http://127.0.0.1:3000/health
```

- 연결 거부: 앱 프로세스·리슨 주소·포트 확인
- 앱의 정상 응답: Nginx의 대상 주소, 요청 경로, Host·TLS 설정 확인
- 연결 후 대기: 앱 로그와 DB·외부 API 지연 확인

PHP-FPM의 FastCGI 소켓은 HTTP 서버가 아니므로 이 `curl` 검사를 그대로 사용하지 않습니다.

## 2. 앱 미실행과 주소 불일치 복구

```bash
# myapp은 실제 서비스 이름으로 교체
sudo systemctl status myapp --no-pager
sudo journalctl -u myapp --since '15 minutes ago' --no-pager
# PM2로 운영하는 경우
pm2 status
```

서비스가 실패했다면 로그에 나온 시작 실패 원인을 먼저 수정합니다. 앱은 3001에서 듣는데 Nginx가 3000으로 연결하는 상황이라면 실제 설계에 맞춰 한쪽을 정렬합니다. Docker Compose에서는 동일 네트워크에 연결된 서비스 이름과 컨테이너 포트를 확인합니다.

## 3. PHP-FPM 소켓과 권한 확인

```bash
# 아래 PHP 버전·경로는 설치 환경에 맞게 변경
sudo systemctl status php8.2-fpm --no-pager
sudo grep -nE '^listen([[:space:]]|\.)' /etc/php/8.2/fpm/pool.d/www.conf
ls -l /run/php/
```

FPM의 `listen`과 Nginx `fastcgi_pass`가 같은 소켓을 가리키는지 비교합니다. 권한 오류라면 FPM의 `listen.owner`, `listen.group`, `listen.mode`와 Nginx 워커 사용자의 접근 권한을 맞춥니다. 상위 디렉터리의 탐색 권한도 필요합니다. [PHP-FPM 설정 문서](https://www.php.net/manual/en/install.fpm.configuration.php)

SELinux/AppArmor 거부 기록이 있다면 필요한 접근 정책을 조정합니다. 소켓에 무조건 `chmod 777`을 적용하거나 보안 모듈 전체를 끄는 방식은 원인에 맞는 수정이 아닙니다.

## 4. 앱 크래시·큰 응답 헤더·타임아웃 구분

```bash
sudo journalctl -k --since '30 minutes ago' --no-pager | grep -iE 'oom|killed process'
free -h
```

`upstream prematurely closed connection`과 같은 시각에 앱 재시작이나 메모리 종료가 있는지 확인합니다. 큰 헤더 오류는 쿠키나 인증 응답 크기를 먼저 점검한 뒤 해당 프로토콜의 버퍼를 조정합니다.

**502가 떴다는 이유만으로 `proxy_read_timeout`부터 늘리지 마세요.** 이 값은 upstream으로부터 연속된 읽기 사이의 대기 제한이며, 전체 요청 처리 시간 제한과 같지 않습니다. 타임아웃은 흔히 504 진단과 연결되므로 실제 로그와 응답을 함께 확인합니다. [Nginx proxy_read_timeout 문서](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout)

## 5. 수정 후 검증

```bash
sudo nginx -t
# 문법 검사가 성공했을 때만 실행
sudo systemctl reload nginx
```

upstream 직접 요청과 외부 도메인 요청을 모두 다시 확인합니다. HTTP 상태가 예상값으로 돌아왔는지, 같은 오류가 새 로그에 계속 쌓이는지를 봅니다. 앱의 401·404를 무조건 장애로 보지 말고 테스트한 경로의 정상 응답 기준과 비교하세요.

## 자주 묻는 질문

### Nginx를 재시작하면 해결되나요?

앱 미실행, 잘못된 upstream 주소, 소켓 권한이 원인이면 Nginx만 재시작해도 해결되지 않습니다. 로그가 가리키는 계층을 먼저 수정해야 합니다.

### 앱은 정상인데 Docker에서만 502가 납니다

앱 컨테이너 내부 테스트와 Nginx 컨테이너에서의 접근 테스트는 다릅니다. 서비스 DNS 이름, 네트워크 연결, 앱의 리슨 주소와 컨테이너 포트를 대조하세요.


타임아웃 로그가 확인됐다면 [nginx·ALB·gunicorn의 504 타임아웃 진단](/blog/504-gateway-time-out-원인-진단-nginxalbgunicorn-타임아웃-정렬-런북)으로 이어가세요.
