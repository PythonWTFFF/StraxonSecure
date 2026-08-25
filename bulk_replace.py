import os

directory = r"c:\project Straxon\straxonsecure\src"
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            if "Straxon Labs" in content or "STRAXON LABS" in content:
                content = content.replace("Straxon Labs", "Straxon Secure")
                content = content.replace("STRAXON LABS", "STRAXON SECURE")
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
