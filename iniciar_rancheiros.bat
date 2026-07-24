@echo off
:: Garante que o terminal execute na pasta atual onde o arquivo .bat esta localizado
cd /d "%~dp0"

title Rancheiro's Bar - Sistema de Comandas
color 0A
echo =========================================================
echo       RANCHEIRO'S BAR - CHOPP & PETISCOS
echo       Iniciando Sistema de Comandas e Atendimento...
echo =========================================================
echo.

:: 1. Verifica se esta dentro de um ZIP sem extrair
if not exist "package.json" (
    echo [ATENCAO] O arquivo package.json nao foi encontrado nesta pasta!
    echo.
    echo MOTIVO PROVAVEL:
    echo Voce tentou dar dois cliques diretamente de dentro do arquivo .ZIP compactado.
    echo.
    echo COMO RESOLVER:
    echo 1. Clique com o botao direito na pasta compactada .ZIP
    echo 2. Escolha "Extrair Tudo..." (ou "Extract All")
    echo 3. Abra a pasta EXTRAIDA e de dois cliques no arquivo "iniciar_rancheiros.bat"
    echo.
    pause
    exit /b
)

:: 2. Verifica se o Node.js esta instalado no sistema
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO CRITICO] O Node.js nao foi encontrado no Windows!
    echo.
    echo COMO RESOLVER:
    echo 1. Baixe o Node.js gratuito em: https://nodejs.org
    echo 2. Instale o arquivo baixado (pode clicar em 'Avançar/Next' ate o final)
    echo 3. APOS INSTALAR: Reinicie seu computador ou feche esta janela e abra novamente.
    echo.
    pause
    exit /b
)

echo [1/3] Verificando e instalando componentes necessarios...
if not exist node_modules (
    echo Primeira execucao detectada. Instalando pacotes (pode levar 1 minuto)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar pacotes via npm install.
        pause
        exit /b
    )
)

echo.
echo [2/3] Abrindo o navegador do sistema...
start http://localhost:3000

echo.
echo [3/3] Servidor ativado com sucesso!
echo =========================================================
echo ATENCAO: Mantenha esta janela aberta enquanto trabalha no bar.
echo Para encerrar o sistema, basta fechar esta janela preta.
echo =========================================================
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ATENCAO] O servidor encerrou com erro.
    pause
)
