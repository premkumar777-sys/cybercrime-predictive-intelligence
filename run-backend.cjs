const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const winPy = path.join(__dirname, 'backend', '.venv', 'Scripts', 'python.exe');
const unixPy = path.join(__dirname, 'backend', '.venv', 'bin', 'python');

let pythonPath = 'python';
if (isWin && fs.existsSync(winPy)) {
  pythonPath = winPy;
} else if (!isWin && fs.existsSync(unixPy)) {
  pythonPath = unixPy;
}

const child = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', '8000', '--reload'], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

