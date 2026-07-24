#!/usr/bin/env python3
import argparse, json, os, datetime

parser = argparse.ArgumentParser()
parser.add_argument('--task', required=True)
parser.add_argument('--cli', required=True)
parser.add_argument('--status', required=True)
parser.add_argument('--loc-changed', type=int, default=0)
args = parser.parse_args()

log_path = os.path.join(os.path.dirname(__file__), '..', '.claude', 'cli-swarm-log.jsonl')
os.makedirs(os.path.dirname(log_path), exist_ok=True)

entry = {
    'ts': datetime.datetime.utcnow().isoformat() + 'Z',
    'task': args.task,
    'cli': args.cli,
    'status': args.status,
    'loc_changed': args.loc_changed,
}
with open(log_path, 'a') as f:
    f.write(json.dumps(entry) + '\n')
print(f"Logged: {args.task} [{args.cli}] -> {args.status}")
