import os
import re

directory = r'C:\project Straxon\straxonsecure\src\server'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            modified = False
            
            # If the file imports createServerFn
            if 'createServerFn' in content and 'requireRequestId' not in content:
                # Add import
                if 'import { createServerFn }' in content:
                    content = content.replace(
                        'import { createServerFn } from "@tanstack/react-start";',
                        'import { createServerFn } from "@tanstack/react-start";\nimport { requireRequestId } from "@/server/security/requestId";'
                    )
                    modified = True
                
                # Replace middleware array
                # .middleware([requireSupabaseAuth]) -> .middleware([requireRequestId, requireSupabaseAuth])
                new_content = re.sub(
                    r'\.middleware\(\[(.*?)\]\)',
                    lambda m: f'.middleware([requireRequestId, {m.group(1)}])' if 'requireRequestId' not in m.group(1) else m.group(0),
                    content
                )
                if new_content != content:
                    content = new_content
                    modified = True
                
            if modified:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {file}")
