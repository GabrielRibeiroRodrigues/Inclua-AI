@echo off
echo ========================================
echo   INCLUA-AI - Iniciar Servidores
echo ========================================
echo.

echo [1/2] Iniciando servidor de arquivos estaticos (porta 8080)...
start "Inclua-AI Static Server" cmd /k "python -m http.server 8080"
timeout /t 2 /nobreak >nul

echo [2/2] Iniciando servidor de API (porta 3000)...
start "Inclua-AI API Server" cmd /k "cd servidor && node server.js"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Servidores Iniciados!
echo ========================================
echo.
echo  Frontend: http://localhost:8080
echo  API:      http://localhost:3000
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

start http://localhost:8080/index.html

echo.
echo Para parar os servidores, feche as janelas de comando.
echo.
