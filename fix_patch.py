
import os
path = '../straxon-ml-engine/main.py'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'print(flush=True, ' in line:
        new_line = line.replace('print(flush=True, ', 'print(')
        new_line = new_line.replace(')\n', ', flush=True)\n')
        new_lines.append(new_line)
    else:
        new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)
print('Fixed main.py syntax successfully')

