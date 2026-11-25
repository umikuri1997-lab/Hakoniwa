@echo off
chcp 65001 >nul
rem Blender を OpenGL で起動する（AMD の Vulkan ドライバーで落ちるのをさける）
rem 起動したら、編集 → プリファレンス → システム → GPUバックエンド が OpenGL になっているので、
rem 左下のメニューの「プリファレンスを保存」をおすと、つぎからはふつうに起動しても OpenGL になる。
where blender >nul 2>nul
if %errorlevel%==0 (
  start "" blender --gpu-backend opengl
  exit /b
)
set B=C:\Program Files\WindowsApps\BlenderFoundation.Blender_5.3.0.0_x64__ppwjx1n5r4v9t\Blender\blender.exe
if exist "%B%" (
  start "" "%B%" --gpu-backend opengl
  exit /b
)
echo Blender が見つかりませんでした。
pause
