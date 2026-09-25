@echo off
title SandBox Sunucusu
echo SandBox baslatiliyor...
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [HATA] Python bulunamadi! Lutfen python'un yuklu oldugundan emin olun.
    pause
)
