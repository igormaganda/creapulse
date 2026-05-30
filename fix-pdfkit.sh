#!/bin/bash
FONT_FILE="/home/z/my-project/.next/dev/server/chunks/node_modules_pdfkit_js_pdfkit_es_0eb066eb.js"
# Wait for the file to exist
while [ ! -f "$FONT_FILE" ]; do sleep 1; done
# Patch it
sed -i "s|'/ROOT/|'/home/z/my-project/|g" "$FONT_FILE"
echo "[FIX] pdfkit font paths patched at $(date)"
