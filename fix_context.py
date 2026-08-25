import os, glob, re

for f in glob.glob('c:/project Straxon/straxonsecure/src/server/**/*.ts', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Fix context. to context!.
    content = re.sub(r'\bcontext\.(?!\!)', 'context!.', content)
    
    # Fix ...context to ...(context || {})
    content = re.sub(r'\.\.\.context\b(?!\s*\|\|)', '...(context || {})', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Context fixed.")
