import re
import os

path = r'C:\project Straxon\straxonsecure\src\server\pentest.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the truncated return issue
# Let's just do a clean regex replace or restore from git and then inject properly.
# Actually, I can just restore from git and then use regex.
