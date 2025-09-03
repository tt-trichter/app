#!/usr/bin/env bash

random_float() {
  awk -v min="$1" -v max="$2" 'BEGIN{srand(); print min + rand() * (max - min)}'
}

# wget https://picsum.photos/500/500.jpg -O /tmp/placehold.jpg

# auth="Basic dHJpY2h0ZXI6c3VwZXItc2FmZS1wYXNzd29yZA=="

# image=$(xh POST http://localhost:5173/api/v1/images \
#   Authorization:"$auth" \
#   Content-Type:image/jpeg \
#   Accept:text/plain \
#   @/tmp/placehold.jpg)
#
# rm /tmp/placehold.jpg

rate=$(random_float 4 12 | awk '{printf "%.2f", $0 + 1}')
duration=$(random_float 2 10 | awk '{printf "%.2f", $0 + 1}')
volume=$(echo "$rate $duration" | awk '{printf "%.2f", ($1 * $2) / 60}')
userId="oruQxum0AHsDe6o01WYiGYfULDACkVD9"


xh POST localhost:8080/api/v2/runs \
    Content-Type:application/json \
    image=$image \
    rate:=$rate \
    duration:=$duration \
    volume:=$volume
