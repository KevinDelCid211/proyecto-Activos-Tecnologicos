@echo off
REM ===================================================================
REM  Sistema de Gestion de Activos Tecnologicos
REM  Compila y publica el servidor y el cliente web.
REM
REM  Requisitos previos (ver Manual Tecnico):
REM    - SDK de .NET 8.0
REM    - Node.js 18 y Angular CLI 17
REM
REM  Ejecutar este archivo desde la carpeta 03_Codigo_fuente.
REM  El resultado queda en la carpeta  publicado\
REM ===================================================================
setlocal
cd /d "%~dp0"

echo.
echo === 1 de 4: verificando herramientas ===
where dotnet >nul 2>&1 || (echo ERROR: no se encontro el SDK de .NET 8.0. & goto :fin)
where npm    >nul 2>&1 || (echo ERROR: no se encontro Node.js.            & goto :fin)
dotnet --version
node --version

echo.
echo === 2 de 4: compilando el servidor ===
dotnet publish "backend\GestionActivosTI.API\GestionActivosTI.API.csproj" ^
    -c Release -o "publicado\servidor"
if errorlevel 1 (echo ERROR al compilar el servidor. & goto :fin)

echo.
echo === 3 de 4: instalando las bibliotecas del cliente ===
pushd frontend
call npm install
if errorlevel 1 (echo ERROR al instalar las bibliotecas. & popd & goto :fin)

echo.
echo === 4 de 4: compilando el cliente web ===
call npx ng build --configuration production --output-path "..\publicado\cliente"
if errorlevel 1 (echo ERROR al compilar el cliente. & popd & goto :fin)
popd

echo.
echo ===================================================================
echo  Publicacion terminada.
echo.
echo    publicado\servidor   copie esta carpeta al servidor de aplicaciones
echo    publicado\cliente    copie esta carpeta al servidor web
echo.
echo  RECUERDE, antes de poner el sistema en produccion:
echo    - cambiar la contrasena del usuario administrador
echo    - definir JwtSettings:SecretKey en appsettings.json
echo ===================================================================

:fin
echo.
pause
endlocal
