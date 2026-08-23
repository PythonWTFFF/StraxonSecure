with open("main.py", "a") as f:
    f.write("\n\n@app.get('/healthz')\nasync def healthz():\n    return {'status': 'ok'}\n")
