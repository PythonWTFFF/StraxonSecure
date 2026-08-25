import os, glob

for f in glob.glob('c:/project Straxon/straxonsecure/src/server/**/*.ts', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('(context as any).', 'context.')
    content = content.replace('...(context as any)', '...context')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Restored context")
