#!/bin/bash
# Dựng trọn một phần: bash build/make.sh N   (ảnh, giọng đọc, clip, trailer, zip)
set -e
N=$1; R=$(cd "$(dirname "$0")/.." && pwd); export SCRATCH=${SCRATCH:-/tmp}; F=$SCRATCH/frames$N
cd "$R/slides"
python3 ../build/lib.py gen $N
mkdir -p ../phan-$N && rm -f ../phan-$N/*.png && node shoot.cjs phan-$N.html ../phan-$N 2
(cd "$R/.." && PORT=5173 node server.js >/dev/null 2>&1 &) ; sleep 2
python3 ../build/lib.py voice $N; pkill -f "node server.js" || true
enc() { ffmpeg -v error -y -framerate 30 -i $F/f_%04d.png "${@:2}" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart "$1"; }
rm -rf $F && mkdir -p $F && node film.cjs clip-phan-$N.html $F && enc ../clip-phan-$N.mp4 -i $SCRATCH/voice$N/voice.wav
rm -rf $F && mkdir -p $F && node film.cjs trailer-phan-$N.html $F && enc ../trailer-phan-$N.mp4 -f lavfi -i anullsrc=r=44100:cl=stereo
rm -rf $F
T=$(mktemp -d) && cp ../phan-$N/*.png ../clip-phan-$N.mp4 ../trailer-phan-$N.mp4 $T/ && cp ../build/caption-phan-$N.txt $T/caption.txt
rm -f ../phan-$N.zip && (cd $T && zip -q "$R/phan-$N.zip" *) && rm -rf $T
echo "XONG phần $N: $(du -h ../phan-$N.zip | cut -f1)"
