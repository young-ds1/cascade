// 日志：控制台 + 文件
import fs from 'fs';

let logFile = null;

export function setLogFile(path) {
  logFile = path;
}

export function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] ${msg}`;
  console.log(line);
  if (logFile) {
    try { fs.appendFileSync(logFile, line + '\n'); } catch { /* 日志写入失败不阻塞 */ }
  }
}
