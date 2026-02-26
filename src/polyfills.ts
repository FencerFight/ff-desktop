// Полифилл для global
if (typeof global === 'undefined') {
  window.global = window;
}

// Полифилл для process
if (typeof process === 'undefined') {
  window.process = { env: {} } as any;
}

// Полифилл для Buffer
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Полифилл для crypto
if (!window.crypto) {
  (window as any).crypto = {};
}