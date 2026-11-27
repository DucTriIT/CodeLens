#!/bin/bash
# Xem thử ảnh của một phần ở cỡ nhỏ: bash build/preview.sh N
set -e
N=$1; R=$(cd "$(dirname "$0")/.." && pwd); T=${SCRATCH:-/tmp}/prev$N
cd "$R/slides" && python3 ../build/lib.py gen $N && rm -rf $T && mkdir -p $T && node shoot.cjs phan-$N.html $T 1
cd $T && ffmpeg -v error -y -pattern_type glob -i '*.png' -vf "scale=600:-1,tile=5x2" sheet.png
