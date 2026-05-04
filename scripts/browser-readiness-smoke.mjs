import { writeFile } from 'node:fs/promises';

const cfg = {
  target: process.env.TARGET_URL ?? 'http://127.0.0.1:3100/demo',
  cdpBase: process.env.CDP_BASE ?? 'http://127.0.0.1:9222',
  outputPrefix: process.env.OUTPUT_PREFIX ?? 'readiness',
};

const viewports = [
  {
    name: 'mobile',
    metrics: {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    },
  },
  {
    name: 'small-mobile',
    metrics: {
      width: 360,
      height: 740,
      deviceScaleFactor: 3,
      mobile: true,
    },
  },
  {
    name: 'desktop',
    metrics: {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    },
  },
];

async function createTarget(url) {
  const response = await fetch(`${cfg.cdpBase}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`Failed to create Chrome target: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function createClient(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 0;

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;

    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);

    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const id = ++nextId;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
          });
        },
        close() {
          socket.close();
        },
      });
    });

    socket.addEventListener('error', () => {
      reject(new Error(`Chrome DevTools socket failed: ${wsUrl}`));
    });
  });
}

async function checkViewport({ name, metrics }) {
  const target = await createTarget('about:blank');
  const client = await createClient(target.webSocketDebuggerUrl);

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', metrics);
  await client.send('Page.navigate', { url: cfg.target });
  await waitForLoad(client);

  const stages = [];
  stages.push(await snapshot(client, name, 'join'));

  const displayName = `smk${Date.now().toString(36).slice(-6)}${name.slice(0, 3)}`;
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('#displayName');
      const button = document.querySelector('button[type="submit"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(displayName)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      button.click();
    })()`,
  });
  await waitForCondition(client, 'document.body.innerText.includes("Challenge the AI")');
  stages.push(await snapshot(client, name, 'levels'));

  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const level = [...document.querySelectorAll('button')]
        .find((button) => button.getAttribute('aria-label')?.startsWith('Level 1:'));
      level?.click();
    })()`,
  });
  await waitForCondition(client, 'Boolean(document.querySelector("#chat-input"))');
  stages.push(await snapshot(client, name, 'game'));

  await client.send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `fetch('/api/demo/leave', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => {})`,
  });

  client.close();

  return {
    name,
    stages,
  };
}

async function snapshot(client, viewportName, stage) {
  const result = await client.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const root = document.documentElement;
      const body = document.body;
      const card = document.querySelector('.ui-card-elevated');
      const input = document.querySelector('input');
      const textarea = document.querySelector('textarea');
      const button = document.querySelector('button[type="submit"]');
      const sendButton = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === 'Send');
      const cardRect = card?.getBoundingClientRect();
      const inputRect = input?.getBoundingClientRect();
      const textareaRect = textarea?.getBoundingClientRect();
      const buttonRect = button?.getBoundingClientRect();
      const sendButtonRect = sendButton?.getBoundingClientRect();
      const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
      const clientWidth = root.clientWidth;

      return {
        url: location.href,
        title: document.title,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        visualViewportWidth: window.visualViewport?.width ?? null,
        clientWidth,
        scrollWidth,
        horizontalOverflow: scrollWidth > clientWidth + 1,
        cardRect: cardRect ? {
          left: Math.round(cardRect.left),
          right: Math.round(cardRect.right),
          width: Math.round(cardRect.width)
        } : null,
        inputRect: inputRect ? {
          left: Math.round(inputRect.left),
          right: Math.round(inputRect.right),
          width: Math.round(inputRect.width)
        } : null,
        textareaRect: textareaRect ? {
          left: Math.round(textareaRect.left),
          right: Math.round(textareaRect.right),
          width: Math.round(textareaRect.width)
        } : null,
        buttonRect: buttonRect ? {
          left: Math.round(buttonRect.left),
          right: Math.round(buttonRect.right),
          width: Math.round(buttonRect.width)
        } : null,
        sendButtonRect: sendButtonRect ? {
          left: Math.round(sendButtonRect.left),
          right: Math.round(sendButtonRect.right),
          width: Math.round(sendButtonRect.width)
        } : null,
        text: body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 240)
      };
    })()`,
  });

  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });

  const file = `${cfg.outputPrefix}-${viewportName}-${stage}.png`;
  await writeFile(file, Buffer.from(screenshot.data, 'base64'));

  return {
    stage,
    screenshot: file,
    ...result.result.value,
  };
}

function waitForLoad(client) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for page load'));
    }, 10_000);

    const poll = async () => {
      try {
        const result = await client.send('Runtime.evaluate', {
          returnByValue: true,
          expression: 'document.readyState',
        });

        if (result.result.value === 'complete') {
          clearTimeout(timeout);
          resolve();
          return;
        }
      } catch {
        // Keep polling until timeout.
      }

      setTimeout(poll, 100);
    };

    setTimeout(poll, 100);
  });
}

function waitForCondition(client, expression) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for condition: ${expression}`));
    }, 10_000);

    const poll = async () => {
      try {
        const result = await client.send('Runtime.evaluate', {
          returnByValue: true,
          expression,
        });

        if (result.result.value) {
          clearTimeout(timeout);
          resolve();
          return;
        }
      } catch {
        // Keep polling until timeout.
      }

      setTimeout(poll, 100);
    };

    setTimeout(poll, 100);
  });
}

const results = [];
for (const viewport of viewports) {
  results.push(await checkViewport(viewport));
}

const failed = results.flatMap((result) => (
  result.stages
    .filter((stage) => stage.horizontalOverflow)
    .map((stage) => ({ viewport: result.name, ...stage }))
));

console.log(JSON.stringify({
  target: cfg.target,
  results,
  failed,
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
