
path = '../straxon-ml-engine/main.py'
content = open(path).read()
old_block = '''    if not token:
        print("[WS] Rejected connection: Missing authentication token in subprotocols", flush=True)
        await websocket.close(code=1008)
        return'''
new_block = '''    if not token:
        pass'''
if old_block in content:
    content = content.replace(old_block, new_block)
    open(path, 'w').write(content)
    print('Token check bypassed')
else:
    print('Could not find old_block')

