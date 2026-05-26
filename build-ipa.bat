@echo off
chcp 65001 >nul
title ???? - IPA ????

echo ========================================
echo    ???? - ???? IPA
echo ========================================
echo.

REM ?? Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ? ???? Node.js 22
    echo    ??? fnm: winget install Schniz.fnm ^&^& fnm install 22 ^&^& fnm use 22
    pause
    exit /b 1
)

echo ? Node.js
node --version

REM ????
if not exist "node_modules" (
    echo.
    echo ?? ??????...
    call npm install
)

REM ?? EAS CLI
where eas >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ?? ?? EAS CLI...
    call npm install -g eas-cli
)

echo.
echo ========================================
echo  ? 1 ???? Expo ??
echo ========================================
echo.
echo ??????????? https://expo.dev ??????
echo.
pause
call eas login

echo.
echo ========================================
echo  ? 2 ???? IPA?? 10-15 ???
echo ========================================
echo.
echo EAS ????? Apple ID??????????????
echo.
pause
call eas build --platform ios --profile production

echo.
echo ========================================
echo  ? ?????
echo ========================================
echo.
echo ? Expo Dashboard ?? .ipa ??
echo ?? LiveContainer ??? iPhone
echo.
pause
