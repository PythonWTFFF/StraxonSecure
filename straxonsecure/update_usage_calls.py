import os
import re

files_to_update = [
    r'C:\project Straxon\straxonsecure\src\server\scanner.ts',
    r'C:\project Straxon\straxonsecure\src\server\labs.ts',
    r'C:\project Straxon\straxonsecure\src\server\easm.ts',
    r'C:\project Straxon\straxonsecure\src\server\ai.ts'
]

# pentest.ts didn't have logFeatureUsage called? Wait, I saw it in usage.ts but not in pentest.ts? Let me double check, wait grep_search showed pentest.ts line 7 but didn't show a call line! Ah, wait, in pentest.ts, there was no `logFeatureUsage` call, only an import!
# Let me update the ones in the list that do call it.

for path in files_to_update:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        # match: logFeatureUsage(context.userId, "feature", { ... })
        # we append context.requestId
        new_content = re.sub(
            r'(logFeatureUsage\([^;]+?})(\s*\))',
            r'\1, context.requestId\2',
            content
        )

        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {path}")
