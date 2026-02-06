let tickerInterval;

export function startTicker() {
  tickerInterval = setInterval(() => {
    tickerValue++;
    if (tickerValue > maxTicker) tickerValue = 1;

    queue.forEach((item, index) => {
      if (item.tickerTarget === tickerValue) {
        sendNano(item.nano);
        displayChar(item.char);
        queue.splice(index, 1);
      }
    });

  }, 500);
}

// إيقاف المترجم مؤقتًا
export function stopTicker() {
  clearInterval(tickerInterval);
}
