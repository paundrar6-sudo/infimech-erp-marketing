@echo off
title Marketing ERP Control Panel
color 0b

echo ===================================================
echo             MARKETING ERP CONTROL PANEL             
echo ===================================================
echo.

:: 1. Verify and start MySQL
echo [1/3] Memeriksa status MySQL Server...
netstat -ano | findstr :3306 >nul
if %errorlevel% equ 0 (
    echo   - MySQL Server terdeteksi sudah aktif di port 3306.
) else (
    echo   - MySQL Server belum aktif. Memulai server MySQL XAMPP...
    start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone --console
    timeout /t 5 >nul
    netstat -ano | findstr :3306 >nul
    if %errorlevel% equ 0 (
        echo   - MySQL Server berhasil dijalankan.
    ) else (
        echo   - [PERINGATAN] Gagal menjalankan MySQL. Pastikan XAMPP atau MariaDB terinstall.
    )
)
echo.

:: 2. Start Backend Express Server
echo [2/3] Memulai Backend Express API...
cd backend
start /B cmd /c "npm run start"
timeout /t 3 >nul
cd ..
echo.

:: 3. Start Frontend Vite Server
echo [3/3] Memulai Frontend Vite App...
cd frontend
start /B cmd /c "npm run dev"
timeout /t 3 >nul
cd ..
echo.

echo ===================================================
echo     APLIKASI MARKETING ERP SIAP DIGUNAKAN!        
echo ===================================================
echo.
echo   - Frontend Portal : http://localhost:5173
echo   - Backend API      : http://localhost:5000
echo.
echo   Operator Akun Percobaan:
echo     1. Administrator  : admin@erp.com (Pass: admin123)
echo     2. Digital Marketer: marketing@erp.com (Pass: marketing123)
echo     3. Operator CRM   : operator@erp.com (Pass: operator123)
echo.
echo ===================================================
echo Tekan tombol apa saja untuk mematikan semua server...
pause >nul

echo.
echo Menghentikan server Node.js...
taskkill /f /im node.exe >nul 2>&1
echo Selesai. Terima kasih!
timeout /t 2 >nul
