import os, glob, re

for f in glob.glob('c:/project Straxon/straxonsecure/src/server/**/*.ts', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('context!.', '(context as any).')
    content = content.replace('...(context || {})', '...(context as any)')
    content = re.sub(r'\bcontext\.(?!\!)', '(context as any).', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Applied any cast to context")
