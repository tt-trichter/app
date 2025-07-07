#!/usr/bin/env bash

random_float() {
  awk -v min="$1" -v max="$2" 'BEGIN{srand(); print min + rand() * (max - min)}'
}

rate=$(random_float 4 12 | awk '{printf "%.2f", $0}')
duration=$(random_float 2 10 | awk '{printf "%.2f", $0}')
volume=$(echo "scale=2; $rate * $duration / 60" | bc)

auth="Basic dHJpY2h0ZXI6c3VwZXItc2FmZS1wYXNzd29yZA=="

xh POST localhost:5173/api/v1/runs \
    Authorization:"$auth" \
    Content-Type:application/json \
    rate:=$rate \
    duration:=$duration \
    volume:=$volume


