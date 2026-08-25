
import os
path = '../straxon-ml-engine/main.py'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'print(f"[WS] Rejected connection from unauthorized origin:' in line:
        new_lines.append(line.replace('print(', 'print(flush=True, '))
    elif 'if origin and origin not in allowed_origins and not origin.startswith("http://localhost:"):' in line:
        new_lines.append('    if origin and origin not in allowed_origins and not origin.startswith("http://localhost:") and not origin.startswith("http://127.0.0.1:") and not origin.startswith("http://192.168."):\n')
    elif 'print("[WS] Rejected connection: Missing authentication token in subprotocols")' in line:
        new_lines.append(line.replace('print(', 'print(flush=True, '))
    else:
        new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)
print('Patched main.py successfully')

