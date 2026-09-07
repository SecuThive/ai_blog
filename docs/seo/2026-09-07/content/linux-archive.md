리눅스에서 **`.tar.zst`는 `tar --zstd -xf archive.tar.zst`, 단일 `.zst`는 `zstd -d file.zst`로 풉니다.** `.tar.gz`는 `tar -xzf archive.tar.gz`를 사용합니다. 확장자가 비슷해도 여러 파일을 묶은 tar 아카이브인지, 파일 하나를 압축한 것인지 구분해야 합니다.

## 확장자별 압축 해제 명령

아래 tar 예시는 GNU tar 기준이며, 각 압축 프로그램이 설치되어 있어야 합니다. 대상 디렉터리는 먼저 만들고, 처음 받은 파일은 목록을 확인한 뒤 빈 작업 디렉터리에 풉니다.

| 확장자 | 내용 확인 | 압축 해제 |
|---|---|---|
| `.tar` | `tar -tf archive.tar` | `tar -xf archive.tar` |
| `.tar.gz`, `.tgz` | `tar -tzf archive.tar.gz` | `tar -xzf archive.tar.gz` |
| `.tar.bz2` | `tar -tjf archive.tar.bz2` | `tar -xjf archive.tar.bz2` |
| `.tar.xz` | `tar -tJf archive.tar.xz` | `tar -xJf archive.tar.xz` |
| `.tar.zst` | `tar --zstd -tf archive.tar.zst` | `tar --zstd -xf archive.tar.zst` |
| 단일 `.zst` | `zstd -t file.zst`로 무결성 검사 | `zstd -d file.zst` |
| `.zip` | `unzip -l archive.zip` | `unzip archive.zip -d extracted` |
| `.7z` | `7z l archive.7z` | `7z x archive.7z -oextracted` |

GNU tar의 압축 옵션과 zstd의 단일 파일 처리는 공식 매뉴얼에서도 구분합니다. [GNU tar 압축 형식](https://www.gnu.org/s/tar/manual/html_chapter/Formats.html), [zstd CLI 매뉴얼](https://github.com/facebook/zstd/blob/dev/programs/zstd.1.md)

## 압축 형식 비교

압축률·속도는 데이터와 옵션에 따라 달라지며 아래는 용도 선택을 위한 일반적인 경향입니다.

| 형식 | 확장자 | 압축률 | 속도 | 주요 용도 |
|---|---|---|---|---|
| gzip | .tar.gz / .tgz | 중간 | 빠름 | 일반적인 리눅스 배포판, 백업 |
| bzip2 | .tar.bz2 | 높음 | 느림 | 소스 코드 및 대용량 데이터 |
| xz | .tar.xz | 매우 높음 | 매우 느림 | 커널 및 운영 체제 패키지 |
| zip | .zip | 중간 | 빠름 | 크로스 플랫폼 파일 공유 |
| 7-Zip | .7z | 매우 높음 | 느림 | 최대 압축률을 필요로 하는 데이터 |
| Zstandard (Zstd) | .tar.zst | 높음 | 매우 빠름 | 최신 배포판, Docker 이미지 |

## tar 사용법

### 압축 방법
- **gzip 형식으로 압축**: `tar czf archive.tar.gz /path/to/dir`
- **bzip2 형식으로 압축**: `tar cjf archive.tar.bz2 /path/to/dir`
- **xz 형식으로 압축**: `tar cJf archive.tar.xz /path/to/dir`
- **Zstd 형식으로 압축**: `tar --zstd -cf archive.tar.zst /path/to/dir`

### 진행상황 표시
```bash
tar czf archive.tar.gz -v /path/to/dir
```

### 특정 파일 제외 또는 포함
- **특정 파일 제외**:
  ```bash
  tar czf archive.tar.gz --exclude='*.log' --exclude='.git' /path/to/dir
  ```
- **특정 파일만 포함**:
  ```bash
  tar czf archive.tar.gz file1.txt file2.txt dir/
  ```

### 압축 해제 방법
- **형식 자동 감지로 압축 풀기**: `tar xf archive.tar.gz`
- **디렉터리에 압축 파일 풀기**:
  ```bash
  tar xzf archive.tar.gz -C /target/dir
  ```
- **압축된 내용 확인 (해제하지 않음)**: `tar tzf archive.tar.gz`
- **특정 파일만 해제**: `tar xzf archive.tar.gz path/to/specific/file`

### tar 옵션 요약

| 옵션 | 의미 |
|---|---|
| c | 생성: 압축 파일 만들기 |
| x | 해제: 압축 파일 풀기 |
| t | 목록 보기: 내용 확인 |
| z | gzip 형식 지정 |
| j | bzip2 형식 지정 |
| J | xz 형식 지정 |
| f | 파일명 지정 |
| v | 진행상황 출력 |
| C | 대상 디렉터리 |

## gzip / gunzip 사용법

`gzip file.txt`는 기본적으로 원본을 압축 파일로 대체합니다. 원본을 남기려면 `-k` 또는 표준 출력 옵션 `-c`를 사용합니다. [GNU gzip 매뉴얼](https://www.gnu.org/s/gzip/manual/gzip.html)

```bash
# 단일 파일 압축 (성공하면 원본을 .gz로 대체)
gzip file.txt            # → file.txt.gz

# 원본 유지 옵션 (-k)
gzip -k file.txt

# 해제
gunzip file.txt.gz       # 또는 gzip -d file.txt.gz

# 압축 레벨 설정 (1=빠름, 9=최대 압축)
gzip -9 file.txt

# 여러 파일 압축
gzip *.log
```

## zip / unzip 사용법
```bash
# 단일 파일 압축
zip archive.zip file1 file2

# 디렉터리 재귀 압축
zip -r archive.zip /path/to/dir

# 특정 파일 제외
zip -r archive.zip . -x "*.log" -x ".git/*"

# 암호 설정
zip -er archive.zip files/

# 압축 해제
unzip archive.zip

# 특정 디렉터리에 압축 해제
unzip archive.zip -d /target/dir

# 내용 확인
unzip -l archive.zip
```

## 7-Zip (7z) 사용법
```bash
# 배포판 저장소에 맞는 7-Zip 패키지를 설치합니다.
# 실행 파일 이름이 7zz인 배포판에서는 아래 7z를 7zz로 바꿉니다.
command -v 7z || command -v 7zz

# 압축
7z a archive.7z /path/to/dir

# 최대 압축 (-mx=9)
7z a -mx=9 archive.7z /path/to/dir

# 암호 설정
7z a -p archive.7z files/

# 해제
7z x archive.7z -o/target/dir

# 내용 확인
7z l archive.7z
```

## Zstandard (Zstd) 사용법
```bash
sudo apt install -y zstd        # Debian/Ubuntu
sudo dnf install -y zstd        # RHEL/Fedora

# tar.zst 압축 해제 (해제, GNU tar 1.31+, zstd 필요)
tar --zstd -xf archive.tar.zst

# 특정 폴더로 해제
tar --zstd -xf archive.tar.zst -C /target/dir

# tar.zst 생성
tar --zstd -cf archive.tar.zst /path/to/dir

# 단일 파일 압축 및 해제
zstd file.log            # → file.log.zst
zstd -d file.log.zst     # 해제 (= unzstd)

# 고압축 레벨(-19) + 멀티스레드(-T0)
tar -cf backup.tar.zst -I 'zstd -19 -T0' /data

# tar 1.30 이하 버전에서 zstd 사용
zstd -dc archive.tar.zst | tar -xf -
```

## tar, zip, 7z, zstd — 뭘 언제 써야 할까 (차이 요약)

- **tar**: 그 자체는 압축이 아니라 "여러 파일을 하나로 묶는" 아카이브 도구. gzip/bzip2/xz/zstd와 조합해야 압축까지 된다. 리눅스/유닉스 표준, 권한·심볼릭 링크 보존이 필요할 때 기본 선택.
- **zip**: 윈도우·맥 사용자와 파일을 주고받을 때. 압축률·속도는 중간이지만 대부분의 OS에서 별도 설치 없이 열림(크로스 플랫폼 호환성 최우선).
- **7z**: 압축률이 가장 중요하고(예: 배포용 아카이브, 백업 보관), 압축·해제 속도는 느려도 괜찮은 경우.
- **zstd(.tar.zst)**: 압축 속도와 결과 크기를 조절하며 반복 백업·빌드 산출물에 활용할 수 있음. 받는 환경의 zstd 지원 여부를 확인해야 함. **반복 작업에서는 실제 데이터로 gzip·zstd를 비교해 선택하세요.**

| 상황 | 추천 형식 |
|---|---|
| 윈도우 사용자에게 파일 전달 | zip |
| 최대 압축률(용량 절감이 최우선) | 7z 또는 xz |
| 빠른 반복 백업·CI 아티팩트 | zstd(.tar.zst) |
| 리눅스 권한/링크 보존 아카이브 | tar (+ gzip/zstd) |
| 커널·패키지 배포 | xz |

## Zstandard(.zst, .tar.zst) 압축 해제 — 자주 겪는 문제 FAQ

**Q. .zst 파일은 어떻게 압축을 푸나요?**
`zstd` 패키지가 설치돼 있으면 됩니다.
```bash
# 설치
sudo apt install -y zstd    # Debian/Ubuntu
sudo dnf install -y zstd    # RHEL/Fedora

# 단일 .zst 파일 압축 해제
unzstd file.log.zst
# 또는
zstd -d file.log.zst
```

**Q. .tar.zst 파일은 어떻게 여나요?**
GNU tar 1.31 이상에서 `zstd` 실행 파일이 설치되어 있으면 `--zstd` 옵션으로 바로 풀립니다.
```bash
tar --zstd -xf archive.tar.zst
tar --zstd -xf archive.tar.zst -C /target/dir   # 특정 폴더로 해제
```

**Q. `tar: Unrecognized archive format` 또는 `--zstd` 옵션 에러가 나요.**
먼저 `tar --version`, `command -v zstd`, `zstd -t archive.tar.zst`로 구현·설치·파일 무결성을 확인합니다. `--zstd` 미지원, zstd 실행 파일 누락, 파일 손상은 서로 다른 문제입니다. `--zstd`가 없는 tar 구현이라면 zstd 출력을 tar로 전달할 수 있습니다.
```bash
zstd -dc archive.tar.zst | tar -xf -
# tar 버전 확인
tar --version
```

**Q. tar.zst와 zip/7z 중 뭐가 더 빠른가요?**
데이터 종류, 압축 레벨, 스레드 수, CPU에 따라 달라집니다. 고정된 배수로 비교하기보다 실제 백업 데이터로 시간과 결과 크기를 함께 측정하세요. **반복적으로 압축/해제하는 자동화 파이프라인(CI, 백업 스크립트)에는 zstd가 유리합니다.**

**Q. tar czf는 무슨 뜻인가요?**
`c`(생성) + `z`(gzip 압축) + `f`(파일명 지정)의 조합 옵션입니다. zstd로 압축하려면 `z` 대신 `--zstd`를 씁니다: `tar --zstd -cf archive.tar.zst /path`.

## 실무 활용 패턴
```bash
# 로그 디렉터리 일별 백업
tar czf /backup/logs-$(date +%Y%m%d).tar.gz /var/log/myapp/

# 압축 파일 크기 확인
ls -lh archive.tar.gz

# 원격 서버로 스트림 압축 전송
tar czf - /data | ssh user@remote "cat > /backup/data.tar.gz"

# 분할 압축 (4GB 단위)
tar czf - /large-data | split -b 4G - backup.tar.gz.part
```

## tar xzf의 뜻과 자주 하는 실수

`x`는 추출, `z`는 gzip 사용, `f`는 아카이브 파일 지정입니다. `.tar.zst`에 `z`를 붙이는 것이 아니라 `--zstd`를 사용합니다. `-C`는 파일을 풀 위치이며 이미 존재하는 디렉터리를 지정해야 합니다.

```bash
mkdir -p extracted
tar --zstd -tf archive.tar.zst
tar --zstd -xf archive.tar.zst -C extracted
```

`.zst`를 풀었더니 파일 하나만 생기는 것은 정상일 수 있습니다. zstd 자체는 여러 파일을 tar처럼 묶는 도구가 아닙니다. 또한 확장자만 바꾸는 것으로 압축 형식이 변하지 않습니다.

로그 파일을 정기적으로 압축·보관하려면 수동 tar 작업과 별도로 [logrotate 설정과 로그 순환 가이드](/engineer/logrotate-log-rotation-guide)를 확인하세요.
