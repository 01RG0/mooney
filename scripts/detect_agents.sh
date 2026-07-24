#!/usr/bin/env bash
codex_ok=false; agy_ok=false; kilo_ok=false; freebuff_ok=false; vibe_ok=false
which codex &>/dev/null && codex_ok=true
which agy &>/dev/null && agy_ok=true
which kilo &>/dev/null && kilo_ok=true
which freebuff &>/dev/null && freebuff_ok=true
which vibe &>/dev/null && vibe_ok=true
echo "{\"codex\":$codex_ok,\"agy\":$agy_ok,\"kilo\":$kilo_ok,\"freebuff\":$freebuff_ok,\"vibe\":$vibe_ok}"
