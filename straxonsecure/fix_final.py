import os, re

routes_dir = r'c:\project Straxon\straxonsecure\src\routes'
comp_dir = r'c:\project Straxon\straxonsecure\src\components'

# 1. index.tsx: customEase
idx_path = os.path.join(routes_dir, 'index.tsx')
if os.path.exists(idx_path):
    with open(idx_path, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('const customEase = [0.16, 1, 0.3, 1];', 'const customEase = "easeOut";')
    with open(idx_path, 'w', encoding='utf-8') as f:
        f.write(c)

# 2. HeroMesh.tsx: bufferAttribute
hero_path = os.path.join(comp_dir, '3d', 'HeroMesh.tsx')
if os.path.exists(hero_path):
    with open(hero_path, 'r', encoding='utf-8') as f:
        c = f.read()
    c = re.sub(r'<bufferAttribute\s+attach="([^"]+)"\s+count=\{([^}]+)\}\s+array=\{([^}]+)\}\s+itemSize=\{([^}]+)\}\s*/>', r'<bufferAttribute attach="\1" count={\2} array={\3} itemSize={\4} args={[\3, \4]} />', c)
    with open(hero_path, 'w', encoding='utf-8') as f:
        f.write(c)

# 3. LabFrame.tsx: colors type index
lab_path = os.path.join(comp_dir, 'labs', 'LabFrame.tsx')
if os.path.exists(lab_path):
    with open(lab_path, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('const colors = {', 'const colors: Record<string, string> = {')
    with open(lab_path, 'w', encoding='utf-8') as f:
        f.write(c)

# 4. architecture.tsx: targetHandle source
arch_path = os.path.join(routes_dir, 'architecture.tsx')
if os.path.exists(arch_path):
    with open(arch_path, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('source: node.parentNode,', 'source: node.parentNode || "",')
    with open(arch_path, 'w', encoding='utf-8') as f:
        f.write(c)

print('Final fixes applied.')
