import os, glob, re

for f in glob.glob('c:/project Straxon/straxonsecure/src/server/**/*.ts', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = re.sub(r'\bcontext\.userId\b', '((context as any).userId as string)', content)
    content = re.sub(r'\bcontext\.requestId\b', '((context as any).requestId as string)', content)
    content = re.sub(r'\bcontext\.teamRole\b', '((context as any).teamRole as string)', content)
    content = re.sub(r'\bcontext\.teamId\b', '((context as any).teamId as string)', content)
    
    content = content.replace('...context', '...(context as any)')
    content = re.sub(r'\bcontext\.(?!\!)', '(context as any).', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Applied fix4 context casting")
