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

## 🧪 Chạy Tests

### Test Setup và Validation

```cmd
# Vào thư mục tests
cd tests

# Setup môi trường test
npm run e2e:setup

# Kiểm tra hệ thống hoạt động
npm run e2e:validate
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
```

**Nguyên nhân**: Windows không tìm thấy npm command hoặc spawning process issue.

**Giải pháp**:

```cmd
# Option 1: Chạy test trực tiếp với npm
npm test -- --testPathPattern=browser-mcp-control.test.js

# Option 2: Sử dụng npx
npx jest --testPathPattern=e2e --verbose

# Option 3: Chạy từng loại test
npm run test:e2e
npm run test:integration
npm run test:unit

# Option 4: Kiểm tra npm PATH
where npm
# Nếu không có kết quả, thêm C:\Program Files\nodejs\ vào System PATH

# Nếu thấy npm nhưng vẫn lỗi ENOENT, restart terminal và thử:
# Đóng tất cả CMD/PowerShell windows
# Mở CMD/PowerShell mới với quyền Administrator  
# Thử lại npm commands

# Cách thêm Node.js vào PATH (nếu cần):
# 1. Nhấn Win + R, gõ "sysdm.cpl"
# 2. Chọn tab "Advanced" > "Environment Variables" 
# 3. Trong "System variables", tìm "Path", nhấn "Edit"
# 4. Nhấn "New" và thêm: C:\Program Files\nodejs\
# 5. Nhấn OK và restart CMD/PowerShell
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

# Step 2: Start MCP Server (Terminal mới)
# Mở CMD/PowerShell window thứ 2
cd ..\src\server
npm install
npm start

# Step 3: Validate và test (Terminal đầu tiên)
cd Browser-MCP-Control\tests
npm run e2e:validate
npm run test:e2e
```

### Test Nhanh (Nếu gặp lỗi spawn):

```cmd
# Thay vì npm run test:e2e, dùng:
npm test -- --testPathPattern=browser-mcp-control.test.js

# Hoặc
npx jest --testPathPattern=e2e --verbose
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