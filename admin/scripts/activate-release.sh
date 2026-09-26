#!/usr/bin/env bash
# 어드민 릴리스를 활성화하고 오래된 릴리스를 정리한다. admin CD가 서버에서 실행한다.
# 사용: activate-release.sh <admin 디렉터리> <릴리스 이름> [보존 개수=3]
#   <admin 디렉터리>/releases/<릴리스 이름>/index.html 이 있어야 한다.
#   current 는 releases/<릴리스 이름> 을 가리키는 상대 링크로 원자 교체된다(nginx 컨테이너 안에서도 풀리도록).
set -euo pipefail

dir=$1
release=$2
keep=${3:-3}

cd "$dir"

if [ ! -f "releases/$release/index.html" ]; then
  echo "releases/$release/index.html 이 없어 활성화하지 않습니다." >&2
  exit 1
fi

ln -sfn "releases/$release" current.tmp
# -T: current 가 디렉터리 링크여도 그 안으로 옮기지 않고 링크 자체를 바꾼다(rename 은 원자적)
mv -Tf current.tmp current

active=$(basename "$(readlink current)")
ls -1t releases | tail -n +"$((keep + 1))" | while read -r old; do
  if [ "$old" != "$active" ]; then
    rm -rf "releases/$old"
  fi
done

echo "활성 릴리스: $active"
