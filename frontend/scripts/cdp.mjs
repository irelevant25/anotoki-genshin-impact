// A minimal Chrome DevTools Protocol client, for scripts/screenshots.mjs: one page, send and await, events.
// The browser (Edge or Chrome) is already running with --remote-debugging-port. Node 22 has the WebSocket
// this needs built in.

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** A new tab in the browser listening on `port`. */
export async function openPage(port) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  return connect(target.webSocketDebuggerUrl, port, target.id);
}

/**
 * Asks the browser on `port` to close itself, every process of it. Edge's launcher hands the browser to a
 * process of its own and exits, so stopping the process this script started would leave the browser running.
 */
export async function closeBrowser(port) {
  try {
    const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
    const browser = await connect(version.webSocketDebuggerUrl, port, null);
    // The answer may never come: the browser is going.
    await Promise.race([browser.send('Browser.close').catch(() => undefined), sleep(3000)]);
    browser.socket.close();
    return true;
  } catch {
    return false;
  }
}

async function connect(url, port, targetId) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener('message', (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) {
        reject(new Error(`${data.error.message} ${data.error.data ?? ''}`));
      } else {
        resolve(data.result);
      }
      return;
    }
    for (const listener of listeners.get(data.method) ?? []) {
      listener(data.params);
    }
  });

  const page = {
    socket,
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    on(method, listener) {
      if (!listeners.has(method)) {
        listeners.set(method, []);
      }
      listeners.get(method).push(listener);
    },
    async evaluate(expression) {
      const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) {
        throw new Error(`evaluate failed: ${JSON.stringify(result.exceptionDetails).slice(0, 400)}`);
      }
      return result.result.value;
    },
    async close() {
      socket.close();
      if (targetId) {
        await fetch(`http://127.0.0.1:${port}/json/close/${targetId}`).catch(() => undefined);
      }
    },
  };
  return page;
}

/** Polls an expression in the page until it is truthy; the last answer is returned either way. */
export async function waitFor(page, expression, timeout = 15000, interval = 150) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try {
      last = await page.evaluate(expression);
      if (last) {
        return last;
      }
    } catch (error) {
      last = error.message;
    }
    await sleep(interval);
  }
  return last;
}
