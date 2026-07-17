#!/bin/bash
cd /home/z/my-project
while true; do
  rm -f dev.log
  bun run dev 2>&1 | tee dev.log
  echo "=== SERVER CRASHED - RESTARTING IN 2s ==="
  sleep 2
done
