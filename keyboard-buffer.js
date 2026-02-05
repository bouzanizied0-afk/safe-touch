// keyboard/keyboard-buffer.js

import { reserveChar } from "../time/time-encoder.js";

let buffer = [];
let sequence = 0;

export function bufferChar(char) {
  buffer.push({
    char,
    order: sequence++,
    reservedAt: Date.now()
  });

  reserveChar(char); // نمرر الحرف كما هو
}

export function flushBuffer() {
  const message = buffer
    .sort((a, b) => a.order - b.order)
    .map(item => item.char)
    .join("");

  buffer = [];
  sequence = 0;

  return message;
}
