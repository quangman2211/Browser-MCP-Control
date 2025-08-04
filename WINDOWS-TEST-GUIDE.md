# 🪟 Browser MCP Control - Windows Testing Guide

## Tổng Quan

Hướng dẫn chi tiết để chạy test Browser MCP Control system trên Windows.

**Repository**: https://github.com/quangman2211/Browser-MCP-Control

## 📋 Yêu Cầu Hệ Thống

### Cần Cài Đặt Trước:

1. **Node.js >= 16.0.0**
   - Download từ: https://nodejs.org/
   - Chọn LTS version (khuyến nghị)
   - Verify: `node --version` và `npm --version`

2. **Google Chrome hoặc Chromium**
   - Download từ: https://www.google.com/chrome/
   - Hoặc Chromium: https://chromium.org/getting-involved/download-chromium/

3. **Git (Optional)**  
   - Download từ: https://git-scm.com/download/win
   - Hoặc sử dụng GitHub Desktop

## 🚀 Cài Đặt Dự Án

### Bước 1: Clone Repository

```cmd
# Sử dụng Git
git clone https://github.com/quangman2211/Browser-MCP-Control.git
cd Browser-MCP-Control

# Hoặc download ZIP từ GitHub và giải nén
```

### Bước 2: Cài Đặt Dependencies

**Cài đặt cho tất cả components:**

```cmd
# 1. Cài đặt test dependencies
cd tests
npm install

# 2. Cài đặt MCP Server dependencies  
cd ..\src\server
npm install

# 3. Cài đặt CLI dependencies
cd ..\cli
npm install

# Quay về thư mục gốc
cd ..\..
```

### Bước 3: Start MCP Server (QUAN TRỌNG!)

**⚠️ BẮT BUỘC: Start MCP Server trước khi chạy test**

```cmd
# Mở CMD/PowerShell window mới (giữ riêng cho server)
cd Browser-MCP-Control\src\server
npm start

# Giữ terminal này chạy - KHÔNG đóng!
# Server chạy trên http://localhost:3000

```

## 🧪 Chạy Tests

### Bước 4: Test Setup và Validation

**Trong terminal thứ 2 (khác với terminal chạy server):**

```cmd
# Vào thư mục tests
cd Browser-MCP-Control\tests

# Setup môi trường test
npm run e2e:setup

# Kiểm tra hệ thống hoạt động (server phải đang chạy!)
npm run e2e:validate

# Bạn sẽ thấy:
# ✅ Node.js Version: Node.js v22.17.0
# ✅ Test Dependencies: All dependencies present
# ✅ MCP Server Health: Server running on port 3000  <-- QUAN TRỌNG!
# ✅ Chrome Extension Files: Extension files present
# ✅ CLI Tools: CLI tools accessible
```

### Các Loại Test

**1. End-to-End Test (Khuyến nghị):**

```cmd
# Test với browser hiển thị (để debug)
npm run e2e

# Test headless mode (nhanh hơn)
npm run e2e:headless

# Test với timeout tùy chỉnh
npm run e2e -- --timeout 120000
```

**2. Test Theo Component:**

```cmd
# Test unit tests
npm run test:unit

# Test integration
npm run test:integration  

# Test performance
npm run test:performance

# Test Chrome Extension
npm run test:extension

# Test MCP Server
npm run test:server
```

**3. Test Coverage:**

```cmd
# Chạy với coverage report
npm run test:coverage
```

## 🔧 Khắc Phục Sự Cố Windows

### Lỗi "spawn npm ENOENT" (Phổ Biến Trên Windows)

```
Error: spawn npm ENOENT
syscall: 'spawn npm'
errno: -4058
code: 'ENOENT'
```

**🎯 Nguyên nhân**: Windows không thể spawn npm process từ custom test runner.

**✅ Giải pháp NHANH NHẤT**:

```cmd
# Thay vì: npm run e2e (bị lỗi)
# Dùng:   npm test trực tiếp

npm test -- --testPathPattern=browser-mcp-control.test.js --verbose
```

**🔧 Các giải pháp khác**:

```cmd
# Option 1: Jest trực tiếp
npx jest --testPathPattern=e2e --verbose

# Option 2: Test từng loại
npm run test:unit
npm run test:integration  
npm run test:performance

# Option 3: Jest với pattern cụ thể
npx jest e2e/browser-mcp-control.test.js

# Option 4: Bypass custom runner hoàn toàn
cd Browser-MCP-Control\tests
npx jest
```

**🛠️ Debug PATH Issues**:

```cmd
# Bước 1: Kiểm tra npm có trong PATH
where npm

# Bạn sẽ thấy:
# C:\Program Files\nodejs\npm
# C:\Program Files\nodejs\npm.cmd

# Bước 2: Nếu KHÔNG thấy npm, thêm vào PATH:
# Win + R → gõ "sysdm.cpl" → Advanced → Environment Variables
# System variables → Path → Edit → New → C:\Program Files\nodejs\

# Bước 3: Restart CMD/PowerShell và thử lại
```

**⚡ Solution cho Windows 10/11**:

```cmd
# Nếu vẫn lỗi, restart với Administrator:
# 1. Đóng TẤT CẢ CMD/PowerShell windows
# 2. Right-click Start → "Command Prompt (Admin)" hoặc "PowerShell (Admin)"
# 3. Chạy lại commands

# Alternative: Use PowerShell thay Command Prompt
powershell
cd Browser-MCP-Control\tests
npm test -- --testPathPattern=browser-mcp-control.test.js
```

### Lỗi JavaScript Syntax Error

```
SyntaxError: Unexpected token, expected "," (112:49)
console.log('🧪 Test Suite Started - David\\'s QA Framework');
```

**Nguyên nhân**: Backslash không được escape đúng trong JavaScript strings.

**Giải pháp**: Pull latest code từ GitHub (đã được fix tự động).

```cmd
git pull origin master
```

### Lỗi MCP Server Not Running

```
❌ MCP Server Health: Server not running (start with: npm run start:server)
```

**Giải pháp**: Start MCP Server trong terminal riêng biệt.

```cmd
# Terminal/CMD Window 1: Start MCP Server
cd src\server
npm install
npm start
# Để nguyên terminal này chạy

# Terminal/CMD Window 2: Run tests
cd tests
npm run e2e:validate
npm run test:e2e
```

### Lỗi PowerShell Execution Policy

```powershell
# Mở PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Hoặc sử dụng Command Prompt thay vì PowerShell
```

### Lỗi Path với Spaces

```cmd
# Sử dụng quotes cho paths có spaces
cd "C:\Users\Your Name\Browser-MCP-Control"

# Hoặc sử dụng path ngắn
cd C:\Users\YOURNA~1\BROWSE~1
```

### Lỗi Chrome/Chromium Detection

```cmd
# Set Chrome path manually (nếu cần)
set PUPPETEER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"

# Hoặc cho Chromium
set PUPPETEER_EXECUTABLE_PATH="C:\Users\%USERNAME%\AppData\Local\Chromium\Application\chrome.exe"
```

### Lỗi Port đã được sử dụng

```cmd
# Kiểm tra port 3000 (MCP Server)
netstat -ano | findstr :3000

# Kill process nếu cần
taskkill /PID <process_id> /F
```

## 🏃‍♂️ Quick Start Commands

### Test Cơ Bản (5 phút):

```cmd
# Step 1: Clone và cài đặt
git clone https://github.com/quangman2211/Browser-MCP-Control.git
cd Browser-MCP-Control\tests
npm install

# Step 2: Start MCP Server (Terminal/CMD Window 1)
cd Browser-MCP-Control\src\server
npm install
npm start
# ← Giữ terminal này chạy, KHÔNG đóng!

# Step 3: Run Tests (Terminal/CMD Window 2 - MỚI)
cd Browser-MCP-Control\tests
npm run e2e:validate
npm run test:e2e
```

### ⚡ Test Commands Alternatives (Khi gặp lỗi spawn)

**Nếu `npm run e2e` bị lỗi "spawn npm ENOENT", dùng:**

```cmd
# ✅ RECOMMEND: Jest trực tiếp
npm test -- --testPathPattern=browser-mcp-control.test.js --verbose

# ✅ ALTERNATIVE: npx jest  
npx jest --testPathPattern=e2e --verbose

# ✅ SPECIFIC FILE: Test file cụ thể
npx jest e2e/browser-mcp-control.test.js

# ✅ ALL TESTS: Chạy tất cả tests
npx jest

# ✅ WITH COVERAGE: Test + coverage
npx jest --coverage
```

**🎯 Commands cho từng tình huống:**

```cmd
# Khi custom runner fail
npm test                                    # Chạy tất cả Jest tests

# Khi chỉ muốn test E2E
npm test -- --testPathPattern=e2e          # E2E tests only

# Khi muốn verbose output
npm test -- --verbose                      # Chi tiết output

# Khi muốn test specific file
npm test -- browser-mcp-control.test.js    # File cụ thể
```

### Test Đầy Đủ (10 phút):

```cmd
cd tests
npm install
npm run e2e:setup
npm run e2e
npm run test:coverage
npm run e2e:report
```

## 📊 Xem Kết Quả Test

### Test Reports

```cmd
# Xem báo cáo mới nhất
npm run e2e:report

# Reports được lưu tại:
# tests\reports\e2e-report-[timestamp].json
# tests\reports\e2e-report-[timestamp].html  
# tests\reports\latest-summary.md
```

### Coverage Reports

```cmd
# Coverage reports tại:
# tests\coverage\lcov-report\index.html
```

## 🐛 Debug Mode

### Khi Test Fail:

```cmd
# Enable debug mode
set E2E_DEBUG=true
set E2E_VERBOSE=true

# Chạy với verbose output
npm run e2e -- --verbose

# Test specific pattern
npm run e2e -- --spec "Console" --verbose
```

### Manual Component Testing:

```cmd
# 1. Start MCP Server manually
cd src\server
npm start

# 2. Test CLI manually (terminal mới)
cd src\cli  
node index.js mcp-browser console-hello

# 3. Load Chrome Extension manually
# Chrome > Extensions > Developer mode > Load unpacked > chọn src\extension\
```

## 📁 Cấu Trúc Test Files

```
tests/
├── package.json              # Test dependencies và scripts
├── setup.js                  # Test environment setup
├── run-e2e-tests.js          # CLI test runner
├── e2e/
│   ├── browser-mcp-control.test.js  # Main E2E tests
│   └── extension.test.js            # Extension-specific tests
├── integration/
│   └── full-system.test.js          # System integration tests
├── unit/
│   └── server.test.js               # Server unit tests
├── performance/
│   └── benchmark.test.js            # Performance benchmarks
└── utils/
    ├── e2e-test-runner.js           # Test execution utilities
    └── browser-console-validator.js # Console validation helpers
```

## ✅ Success Criteria

**Test sẽ PASS nếu:**

- ✅ CLI command `mcp-browser console-hello` hoạt động
- ✅ Browser console hiển thị "Hello World"  
- ✅ Response time < 2 giây
- ✅ Success rate > 95%
- ✅ Visual confirmation overlay xuất hiện

## 🎯 Test Commands cho Windows

### PowerShell:

```powershell
# Clone và setup
git clone https://github.com/quangman2211/Browser-MCP-Control.git
cd Browser-MCP-Control\tests
npm install

# Chạy test
npm run e2e:headless
```

### Command Prompt:

```cmd
REM Clone và setup  
git clone https://github.com/quangman2211/Browser-MCP-Control.git
cd Browser-MCP-Control\tests
npm install

REM Chạy test
npm run e2e:headless
```

### Git Bash (nếu cài Git):

```bash
# Clone và setup
git clone https://github.com/quangman2211/Browser-MCP-Control.git
cd Browser-MCP-Control/tests
npm install

# Chạy test
npm run e2e:headless
```

## 📞 Hỗ Trợ

**Nếu gặp vấn đề:**

1. **Kiểm tra system requirements**: Node.js >= 16, Chrome installed
2. **Chạy validation**: `npm run e2e:validate`
3. **Check debug logs**: `npm run e2e -- --verbose`
4. **Manual testing**: Start server và CLI manually để debug

**GitHub Issues**: https://github.com/quangman2211/Browser-MCP-Control/issues

---

*Hướng dẫn này đảm bảo Browser MCP Control test suite chạy mượt mà trên Windows với đầy đủ E2E validation.*