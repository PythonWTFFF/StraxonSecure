import re

# Update soc.ts
path = r'C:\project Straxon\straxonsecure\src\server\soc.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'sharedCache' not in content:
    content = content.replace(
        'import { supabaseAdmin } from "@/integrations/supabase/client.server";',
        'import { supabaseAdmin } from "@/integrations/supabase/client.server";\nimport { sharedCache } from "@/server/utils/cache";'
    )

# Wrap getSOCAnalytics handler
# Let's find the getSOCAnalytics block
block_start = content.find('export const getSOCAnalytics')
handler_start = content.find('.handler(async () => {', block_start)

if handler_start != -1 and 'sharedCache.get' not in content:
    replacement = """.handler(async () => {
    const cached = sharedCache.get("soc_analytics");
    if (cached) return cached;
"""
    content = content[:handler_start] + replacement + content[handler_start + len('.handler(async () => {'):]
    
    # Now find the end of the handler to set cache. The return statement is:
    # return {
    #   timeSeries,
    #   attackFreq: Object.entries(attackFreq)...
    #   ...
    # };
    # We will just replace `return {` with `const result = {` and then add `sharedCache.set("soc_analytics", result, 60000); return result;`
    # Let's use regex to find the return block in getSOCAnalytics
    content = re.sub(
        r'(return \{[\s\S]*?mitreTactics:[^}]+\};)',
        r'const result = \1\n    sharedCache.set("soc_analytics", result, 60000);\n    return result;',
        content
    )
    # Wait, the return might be different. Let's just find the last `return {` in the getSOCAnalytics block.
    # A safer way is to do it manually in JS or use Python regex that matches the return object precisely.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated soc.ts")
