#!/usr/bin/env python3
import json, os, collections

log_path = os.path.join(os.path.dirname(__file__), '..', '.claude', 'cli-swarm-log.jsonl')
if not os.path.exists(log_path):
    print("No delegation log found.")
    exit(0)

rows = [json.loads(l) for l in open(log_path) if l.strip()]
by_cli = collections.defaultdict(list)
for r in rows:
    by_cli[r['cli']].append(r)

print("\n=== CLI Swarm Delegation Dashboard ===\n")
total_loc = 0
for cli, tasks in sorted(by_cli.items()):
    ok = sum(1 for t in tasks if t['status'] == 'success')
    loc = sum(t.get('loc_changed', 0) for t in tasks)
    total_loc += loc
    print(f"  {cli:<12} tasks={len(tasks)}  success={ok}/{len(tasks)}  loc_changed={loc}")
print(f"\n  TOTAL delegated: {len(rows)} tasks, ~{total_loc} LOC changed")
# rough estimate: 1 LOC ~ 4 tokens saved
print(f"  Estimated tokens saved by delegation: ~{total_loc * 4:,}\n")
