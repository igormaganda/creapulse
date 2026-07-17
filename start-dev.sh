#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting dev server..."
  rm -f dev.log
  bun run dev >> dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done