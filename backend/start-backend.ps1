$env:PATH = "C:\Users\Colorful\Desktop\app\backend\node_modules\.bin;$env:PATH"
Set-Location "C:\Users\Colorful\Desktop\app\backend"
ts-node-dev --respawn --transpile-only src/app.ts
