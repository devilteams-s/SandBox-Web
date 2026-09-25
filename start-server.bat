@echo off
title ElementLab Simulator Sunucusu
echo ElementLab Simulator baslatiliyor...
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [HATA] Python bulunamadi! Lutfen python'un yuklu oldugundan emin olun.
    pause
)
