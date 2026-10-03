-- stale-refresh 2026-10-04 post #747 git-push-거부-non-fast-forward-remote-contains-work-해결법
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$# git push 거부 "remote contains work" non-fast-forward 완벽 해결법

## "fetch first"라는 빨간 메시지 앞에서 멈춘 당신에게

작업을 마치고 자신 있게 `git push`를 눌렀는데 터미널이 빨간 글씨로 이렇게 답합니다.

```
! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'origin'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally. ... (fetch first)
```

**먼저 안심하세요. 당신의 커밋은 아직 한 줄도 날아가지 않았습니다.** 이 에러는 "거부"이지 "삭제"가 아닙니다. 원격 저장소가 당신의 로컬보다 앞서 있으니, 합치고 나서 다시 보내라는 정중한 경고일 뿐입니다.

여기서 가장 위험한 행동은 검색해서 나온 `git push --force`를 무작정 복사해 붙이는 것입니다. 그 순간 동료의 커밋이 사라질 수 있습니다. 30초만 투자해서 원인부터 진단합시다.

## 에러 메시지 한 줄로 원인 구분하기

같은 "rejected"라도 메시지의 디테일이 원인을 알려줍니다. 아래 표로 내 상황을 먼저 찾으세요.

| 상황 | 실제 출력 메시지 | 원인 한 줄 | 권장 조치 |
|------|------------------|-----------|-----------|
| 원격이 앞섬 | `! [rejected] main -> main (fetch first)` / `Updates were rejected because the remote contains work` | 내가 작업하는 동안 누군가 같은 브랜치에 push 함 | `git pull --rebase` 후 push |
| 로컬·원격 분기 | `! [rejected] main -> main (non-fast-forward)` / `failed to push some refs to 'origin'` | 로컬과 원격이 서로 다른 커밋으로 갈라짐 | `fetch` → 충돌 해결 → push |
| 누군가 강제푸시함 | `(non-fast-forward)` 인데 `pull` 해도 히스토리가 꼬임 | 동료가 `--force`로 히스토리를 갈아엎음 | 팀 확인 후 `--force-with-lease` |
| 태그 충돌 | `! [rejected] v1.2.0 -> v1.2.0 (would clobber existing tag)` | 원격에 이미 같은 이름 태그 존재 | 태그 삭제 후 재생성 또는 `--force` 태그 |

대부분의 일상적인 협업 상황은 1~2번입니다. 3번은 신중하게, 4번은 태그 전용 처리가 필요합니다.

## 안전한 해결 흐름: rebase vs merge

원격을 로컬로 가져와 합치는 방법은 두 가지입니다. 결과 히스토리가 다릅니다.

**`git pull`(merge 방식)** — 머지 커밋이 생깁니다.

```
*   a1b2c3 Merge branch 'origin/main'   ← 불필요한 머지 커밋
|\
| * 9f8e7d 동료의 커밋 (원격)
* | 4d5c6b 내 커밋 (로컬)
|/
* 0a1b2c 공통 조상
```

**`git pull --rebase`** — 내 커밋을 원격 위로 옮겨 선형으로 만듭니다.

```
* 4d5c6b' 내 커밋 (재배치됨)   ← 깔끔한 직선
* 9f8e7d 동료의 커밋
* 0a1b2c 공통 조상
```

| 구분 | merge | rebase |
|------|-------|--------|
| 히스토리 | 머지 커밋 생김 | 선형 유지 |
| 선호 상황 | 협업 흔적을 그대로 남기고 싶을 때 | 깔끔한 히스토리, PR 리뷰가 쉬운 트렁크 기반 개발 |
| 주의 | 머지 커밋이 누적됨 | 공유 브랜치에 이미 push한 커밋은 rebase 금지 |

개인 브랜치에서 매번 rebase로 당겨 오고 싶다면 `git config --global pull.rebase true`로 기본값을 잡아두면 편합니다. 이 값이 true면 `git pull`이 병합 대신 가져온 브랜치 위로 rebase합니다([git-config 문서](https://git-scm.com/docs/git-config#Documentation/git-config.txt-pullrebase)).

## 복붙 명령어 세트

**일반 케이스 (대부분 이걸로 끝납니다)**

```bash
git fetch origin
git pull --rebase origin main
# 충돌이 나면 파일 수정 후
git add <충돌_해결한_파일>
git rebase --continue
git push origin main
```

**rebase 중 도저히 안 되겠다 싶을 때 (원상복구)**

```bash
git rebase --abort   # rebase 시작 전 상태로 안전하게 복귀
```

**안전한 강제 푸시 (정말 필요한 경우만)**

```bash
git push --force-with-lease origin main
```

**날아간 것 같을 때 복구 — reflog**

```bash
git reflog                    # HEAD가 이동한 모든 기록 확인
# 예: 4d5c6b HEAD@{2}: commit: 살리고 싶은 작업
git reset --hard HEAD@{2}     # 그 시점으로 되돌리기
```

`reflog`는 약 90일간 모든 HEAD 이동을 기록합니다. rebase나 reset으로 커밋이 "사라졌다"고 느껴져도 대부분 여기서 되살릴 수 있습니다. 이게 바로 "데이터는 아직 안 날아갔다"의 근거입니다.

## `--force` vs `--force-with-lease`: 무엇이 다른가

둘의 차이가 팀원 커밋의 생사를 가릅니다.

**`--force`는 무조건 덮어씁니다.** 시나리오를 봅시다.

1. 나와 동료가 같은 시점에서 출발
2. 동료가 커밋 푸시 → 원격이 앞섬
3. 내가 원격 변화를 모른 채 `git push --force` 실행
4. **동료의 커밋이 원격에서 통째로 사라짐** 😱

**`--force-with-lease`는 한 번 더 확인합니다.** 내가 마지막으로 `fetch`한 원격 ref 상태와 현재 원격 상태를 비교해서, **그 사이 누군가 새 커밋을 올렸다면 push를 거부**합니다.

```
$ git push --force-with-lease
! [rejected] main -> main (stale info)   ← 원격이 바뀌었으니 거부됨
```

즉 `--force-with-lease`는 "내가 본 그 상태 그대로일 때만 덮어써라"는 안전장치입니다. 강제 푸시가 불가피하다면 항상 이 옵션을 쓰세요.

> ⚠️ **경고**
> - 공유 브랜치(`main`/`develop`)에 `--force`를 쓰면 팀원 커밋이 영구 삭제될 수 있습니다.
> - 강제 푸시 전에는 **반드시 `git fetch`로 최신 상태를 먼저 확인**하세요. `--force-with-lease`도 fetch 직후에 써야 의미가 있습니다.

### 실무 한마디

저는 신입 때 충돌이 무서워서 `--force`로 밀어버렸다가 동료의 반나절 작업을 날린 적이 있습니다. 다행히 동료의 로컬 `reflog`로 복구했지만, 그 뒤로는 팀에 두 가지를 정착시켰습니다. 첫째, GitHub/GitLab의 **protected branch** 규칙으로 `main`에 force push 자체를 차단. 둘째, 모든 force push는 `--with-lease`만 허용. 이 두 가지만으로 "커밋이 사라졌어요" 사고가 사라졌습니다.

## 재발 방지 체크리스트

오늘 바로 적용할 행동입니다.

- [ ] `git config --global pull.rebase true` 로 pull 기본값을 rebase로
- [ ] `main`/`develop`에 **브랜치 보호 규칙** 활성화 (force push·직접 push 차단)
- [ ] push 전 습관적으로 `git fetch` 먼저 실행
- [ ] 강제 푸시는 무조건 `--force-with-lease`만 사용
- [ ] 작업은 개인 브랜치 → PR(squash/rebase 머지) 흐름으로

빨간 에러 메시지는 사고가 아니라 git이 당신을 보호하는 신호입니다. 메시지를 읽고, 분류표로 원인을 찾고, rebase로 합친 뒤, 정말 필요할 때만 `--force-with-lease`. 이 순서만 지키면 push 거부는 더 이상 무서운 일이 아닙니다.

## 자주 묻는 질문 (FAQ)

**Q. `git pull --rebase` 도중 충돌이 너무 많이 나는데 그냥 처음으로 돌아가고 싶어요.**
A. `git rebase --abort`를 실행하면 rebase 시작 전 상태로 완전히 안전하게 복귀합니다. 데이터 손실이 없으니 부담 없이 사용하세요.

**Q. `--force-with-lease`로 푸시했는데 `stale info`라며 또 거부됩니다.**
A. 마지막 fetch 이후 원격에 새 커밋이 올라왔다는 뜻입니다. 의도된 안전장치입니다. `git fetch` 후 변경 내용을 확인하고, 정말 덮어써도 되는지 판단한 뒤 다시 시도하세요.

**Q. reset --hard로 되돌렸는데 필요한 커밋이 사라졌어요. 복구 가능한가요?**
A. 네. `git reflog`를 실행해 HEAD 이동 기록에서 원하는 시점(`HEAD@{n}`)을 찾아 `git reset --hard HEAD@{n}`으로 되살릴 수 있습니다. reflog는 기본 약 90일간 보존됩니다.

## 출처 · 확인일 2026-10-04
- [Git, git-config: pull.rebase](https://git-scm.com/docs/git-config#Documentation/git-config.txt-pullrebase) — true면 git pull이 병합 대신 rebase$sr$, content_evidence=jsonb_set($j${"en": {"title": "How to Fix a Rejected git push: non-fast-forward and 'remote contains work'", "content": "# The Complete Fix for a Rejected git push: \"remote contains work\" and non-fast-forward\n\n## If you're frozen in front of that red \"fetch first\" message\n\nYou finished your work, hit `git push` with confidence, and the terminal answered in red:\n\n```\n! [rejected]        main -> main (non-fast-forward)\nerror: failed to push some refs to 'origin'\nhint: Updates were rejected because the remote contains work that you do\nhint: not have locally. ... (fetch first)\n```\n\n**First, don't panic. Not a single line of your commits is gone.** This error is a rejection, not a deletion. The remote is simply ahead of your local branch, so Git is politely asking you to integrate those changes before you push again.\n\nThe most dangerous thing you can do right now is blindly copy-paste `git push --force` from a search result. That can wipe a teammate's commits. Spend 30 seconds diagnosing the cause first.\n\n## Diagnose the cause from a single line of the error\n\nEven when the word is the same—\"rejected\"—the details tell you why. Find your situation in the table below.\n\n| Situation | Actual output | Cause in one line | Recommended action |\n|------|------------------|-----------|-----------|\n| Remote is ahead | `! [rejected] main -> main (fetch first)` / `Updates were rejected because the remote contains work` | Someone pushed to the same branch while you were working | `git pull --rebase`, then push |\n| Local and remote have diverged | `! [rejected] main -> main (non-fast-forward)` / `failed to push some refs to 'origin'` | Local and remote split onto different commits | `fetch` → resolve conflicts → push |\n| Someone force-pushed | `(non-fast-forward)`, but history is still tangled after `pull` | A teammate rewrote history with `--force` | Confirm with the team, then `--force-with-lease` |\n| Tag collision | `! [rejected] v1.2.0 -> v1.2.0 (would clobber existing tag)` | A tag with the same name already exists on the remote | Delete and recreate the tag, or force-push the tag |\n\nEveryday collaboration is almost always case 1 or 2. Treat case 3 with extra care, and handle case 4 as a tag-specific problem.\n\n## A safe resolution path: rebase vs merge\n\nThere are two ways to bring the remote into your local branch. The resulting history looks different.\n\n**`git pull` (merge)** — creates a merge commit.\n\n```\n*   a1b2c3 Merge branch 'origin/main'   ← unnecessary merge commit\n|\\\n| * 9f8e7d teammate's commit (remote)\n* | 4d5c6b my commit (local)\n|/\n* 0a1b2c common ancestor\n```\n\n**`git pull --rebase`** — replays your commits on top of the remote, keeping history linear.\n\n```\n* 4d5c6b' my commit (rebased)   ← a clean straight line\n* 9f8e7d teammate's commit\n* 0a1b2c common ancestor\n```\n\n| | merge | rebase |\n|------|-------|--------|\n| History | Merge commit is created | Stays linear |\n| Best when | You want to keep the collaboration trail as-is | Clean history; trunk-based development with easy PR reviews |\n| Watch out | Merge commits pile up | Never rebase commits already pushed to a shared branch |\n\nIf you want to rebase every time you pull on a personal branch, set the default with `git config --global pull.rebase true`. When it is true, `git pull` rebases onto the fetched branch instead of merging ([git-config docs](https://git-scm.com/docs/git-config#Documentation/git-config.txt-pullrebase)).\n\n## Copy-paste command sets\n\n**The common case (this solves most incidents)**\n\n```bash\ngit fetch origin\ngit pull --rebase origin main\n# after resolving conflicts in the files\ngit add <충돌_해결한_파일>\ngit rebase --continue\ngit push origin main\n```\n\n**When rebase is going nowhere (safe undo)**\n\n```bash\ngit rebase --abort   # safely return to the state before rebase started\n```\n\n**Safe force-push (only when you truly need it)**\n\n```bash\ngit push --force-with-lease origin main\n```\n\n**When it looks like work vanished — reflog**\n\n```bash\ngit reflog                    # inspect every HEAD movement\n# e.g. 4d5c6b HEAD@{2}: commit: the work I want to restore\ngit reset --hard HEAD@{2}     # reset to that point\n```\n\n`reflog` records every HEAD movement for about 90 days. Even if a rebase or reset made a commit feel \"gone,\" you can usually restore it from here. That's the evidence behind \"your data is not gone yet.\"\n\n## `--force` vs `--force-with-lease`: what's the difference\n\nThe difference decides whether a teammate's commits live or die.\n\n**`--force` overwrites unconditionally.** Here's the scenario.\n\n1. You and a teammate start from the same point\n2. The teammate pushes a commit → the remote is now ahead\n3. Unaware of the remote change, you run `git push --force`\n4. **The teammate's commit disappears from the remote entirely** 😱\n\n**`--force-with-lease` checks one more time.** It compares the remote ref as of your last `fetch` with the remote's current state, and **rejects the push if anyone published a new commit in between**.\n\n```\n$ git push --force-with-lease\n! [rejected] main -> main (stale info)   ← remote changed, so the push is rejected\n```\n\nIn other words, `--force-with-lease` is a safety latch: \"overwrite only if the remote is still exactly as I last saw it.\" If a force-push is unavoidable, always use this option.\n\n> ⚠️ **Warning**\n> - Using `--force` on a shared branch (`main`/`develop`) can permanently delete teammates' commits.\n> - Before any force-push, **always `git fetch` first** so you know the latest state. `--force-with-lease` only helps if you run it right after a fetch.\n\n### A note from the field\n\nEarly in my career I was so afraid of conflicts that I shoved a `--force` through and wiped half a day of a teammate's work. We recovered it from their local `reflog`, but after that I locked in two team rules. First, GitHub/GitLab **protected branch** rules that block force-push on `main` entirely. Second, every force-push must use `--with-lease`. Those two changes ended the \"my commits disappeared\" incidents.\n\n## Recurrence-prevention checklist\n\nActions you can apply today.\n\n- [ ] Set pull's default to rebase with `git config --global pull.rebase true`\n- [ ] Enable **branch protection rules** on `main`/`develop` (block force-push and direct pushes)\n- [ ] Make `git fetch` a habit before every push\n- [ ] Use only `--force-with-lease` for force-pushes\n- [ ] Work on a personal branch → PR (squash/rebase merge) flow\n\nA red error is not an accident—it's Git protecting you. Read the message, find the cause in the table, integrate with rebase, and use `--force-with-lease` only when you truly must. Follow that order and a rejected push stops being scary.\n\n## FAQ\n\n**Q. I'm getting too many conflicts during `git pull --rebase` and just want to go back to the start.**\nA. Run `git rebase --abort`. It returns you safely to the state before the rebase started. No data is lost, so use it without hesitation.\n\n**Q. I pushed with `--force-with-lease` and it was rejected again with `stale info`.**\nA. That means new commits landed on the remote after your last fetch. That's the safety latch doing its job. `git fetch`, review the changes, decide whether overwriting is still correct, then try again.\n\n**Q. I ran reset --hard and a commit I still need is gone. Can I recover it?**\nA. Yes. Run `git reflog`, find the point you want (`HEAD@{n}`) in the HEAD movement history, and restore it with `git reset --hard HEAD@{n}`. reflog is kept for about 90 days by default.\n\n## Sources · checked 2026-10-04\n- [Git, git-config: pull.rebase](https://git-scm.com/docs/git-config#Documentation/git-config.txt-pullrebase) — when true, git pull rebases instead of merging", "excerpt": "Diagnose git push non-fast-forward and 'remote contains work' rejection errors with a cause-by-cause table, then fix them without data loss using pull --rebase and force-with-lease—plus reflog recovery."}, "verifiedAt": "2026-10-04", "changeSummary": "출처 없는 \"2025~2026년 트렌드\" 주장과 \"90%\" 수치를 삭제하고, pull.rebase 설정을 git 공식 문서로 출처 표시. 출처·확인일 추가.", "officialSources": ["https://git-scm.com/docs/git-config#Documentation/git-config.txt-pullrebase"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=747 AND md5(content)='23953419dfbbabb195a56d0a9ef9cb4e' AND md5(content_evidence::text)='330dc1e5ce3baee21322debe0c9ffcb9' AND md5(coalesce(array_to_string(tags,'|'),''))='fbf12803e80b6ccd80bf1e84313cc81b';
COMMIT;
