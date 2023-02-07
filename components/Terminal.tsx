import { FC, useEffect, useRef } from 'react';
import chalk from 'chalk';

import 'xterm/css/xterm.css';
import { CommitLinksAddon } from '../utils/CommitLinksAddon';
import { wordsCount } from '../utils/WordsCount';

const theme = {
  foreground: '#eff0eb',
  background: '#282a36',
  black: '#282a36',
  brightBlack: '#686868',
  red: '#ff5c57',
  brightRed: '#ff5c57',
  green: '#5af78e',
  brightGreen: '#5af78e',
  yellow: '#f3f99d',
  brightYellow: '#f3f99d',
  blue: '#57c7ff',
  brightBlue: '#57c7ff',
  magenta: '#ff6ac1',
  brightMagenta: '#ff6ac1',
  cyan: '#9aedfe',
  brightCyan: '#9aedfe',
  white: '#f1f1f0',
  brightWhite: '#eff0eb',
};

type SupportLang = 'zh' | 'en';

const localStorageKeys = {
  lang: 'commit-gpt:lang',
};

const initTerminal = async (el: HTMLDivElement): Promise<import('xterm').Terminal> => {
  const { Terminal } = await import('xterm');
  const { FitAddon } = await import('xterm-addon-fit');
  const randomId = Math.random().toString(36).substring(7);
  const fitAddon = new FitAddon();
  let lang: SupportLang = window.localStorage.getItem(localStorageKeys.lang) as SupportLang || 'en';
  let loadingId = -1;
  let input = '';
  const stack: string[] = [];
  let stackIndex = 0;
  let fontSize = 16;

  const width = window.innerWidth;
  if (width >= 768 && width < 1024) {
    fontSize = 14;
  } else if (width >= 600 && width < 768) {
    fontSize = 11;
  } else if (width >= 425 && width < 600) {
    fontSize = 7;
  } else if (width <= 375) {
    fontSize = 6;
  }

  const term = new Terminal({
    theme,
    fontSize,
    fontFamily: '"Cascadia Code", Menlo, monospace',
    cursorBlink: true,
    allowProposedApi: true,
  });

  try {
    const { WebglAddon } = await import('xterm-addon-webgl');
    term.loadAddon(new WebglAddon());
  } catch (e) {
    console.warn('WebGL addon threw an exception during load', e);
    try {
      const { CanvasAddon } = await import('xterm-addon-canvas');
      term.loadAddon(new CanvasAddon());
    } catch (e) {
      console.warn('Canvas addon threw an exception during load', e);
    }
  }

  term.loadAddon(new CommitLinksAddon());
  term.loadAddon(fitAddon);

  term.open(el);

  fitAddon.fit();

  const setLang = (lan: SupportLang) => {
    lang = lan;
    window.localStorage.setItem(localStorageKeys.lang, lang);
  };

  const pushToStack = (value: string) => {
    stack.push(value);
    while (stack.length > 20) {
      stack.shift();
    }
    stackIndex = stack.length - 1;
  };

  const nextStackIndex = () => stackIndex++ % stack.length;

  const prevStackIndex = () => {
    stackIndex = stackIndex === 0 ? stack.length - 1 : stackIndex - 1;
    return stackIndex;
  };

  const prompt = () => {
    term.write('\r\n> ');
  };

  const loading = (load: boolean = true) => {
    window.clearInterval(loadingId);
    if (!load) {
      if (loadingId !== -1) {
        loadingId = -1;
        term.write('\x1b[2K\r');
      }
      return;
    }
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;
    loadingId = window.setInterval(() => {
      term.write('\x1b[2K\r');
      if (lang === 'en') {
        term.write(`${chalk.blue(frames[index++ % frames.length])} Generating suggestions`);
      } else if (lang === 'zh') {
        term.write(`${chalk.blue(frames[index++ % frames.length])} 正在生成建议`);
      }
    }, 80);
  };

  const setReadme = () => {
    term.clear();
    term.write('\x1b[2K\r');
    if (lang === 'en') {
      term.writeln([
        '      ┌──README───────────────────────────────────────────────────────────────────────────┐',
        '      │                                                                                   │',
        '      │  Welcome to Commit-GPT, which will generate several commit messages that conform  │',
        `      │  to the ${chalk.bold.underline('Conventional Commits')} specification using the input description.           │`,
        '      │                                                                                   │',
        '      │  Happy coding.                                                                    │',
        '      │                                                                                   │',
        `      │  Github: ${chalk.italic.underline('https://github.com/hsuanxyz/commit-gpt')}                                   │`,
        '      │                                                                                   │',
        `      │  English / ${chalk.bold.underline('中文')}                                                                   │`,
        '      └───────────────────────────────────────────────────────────────────────────────────┘',
        '',

      ].map((e) => chalk.grey(e)).join('\r\n'));
    } else if (lang === 'zh') {
      term.writeln([
        '      ┌──README─────────────────────────────────────────────────────────────────────────┐',
        '      │                                                                                 │',
        `      │  欢迎使用 Commit-GPT, 它会根据输入的描述生成几条符合 ${chalk.bold.underline('Conventional Commits')} 规范  │`,
        '      │  的 Commit 消息。                                                               │',
        '      │                                                                                 │',
        '      │  Happy coding.                                                                  │',
        '      │                                                                                 │',
        `      │  Github: ${chalk.italic.underline('https://github.com/hsuanxyz/commit-gpt')}                                 │`,
        '      │                                                                                 │',
        `      │  ${chalk.bold.underline('English')} / 中文                                                                 │`,
        '      └─────────────────────────────────────────────────────────────────────────────────┘',
        '',

      ].map((e) => chalk.grey(e)).join('\r\n'));
    }

    term.writeln(`${chalk.cyan('commit.hsuan.xyz')} ${chalk.red('$')} ${chalk.green('commit')}`);

    if (lang === 'en') {
      term.writeln([
        'Enter a description of your commit and press <Enter> key.',
      ].join('\r\n'));
    } else if (lang === 'zh') {
      term.writeln([
        '输入 Commit 的描述并按下 <Enter> 键。',
      ].join('\r\n'));
    }

    prompt();
    term.focus();
  };

  setReadme();

  term.registerLinkProvider({
    provideLinks(bufferLineNumber: number, callback: (links: (import('xterm').ILink[] | undefined)) => void) {
      if (lang === 'en') {
        switch (bufferLineNumber) {
          case 4:
            callback([{
              text: 'Conventional Commits',
              range: { start: { x: 17, y: 4 }, end: { x: 36, y: 4 } },
              activate() {
                window.open('https://www.conventionalcommits.org/', '_blank');
              },
            }]);
            return;
          case 8:
            callback([{
              text: 'https://github.com/hsuanxyz/commit-gpt',
              range: { start: { x: 18, y: 8 }, end: { x: 55, y: 8 } },
              activate() {
                window.open('https://github.com/hsuanxyz/commit-gpt', '_blank');
              },
            }]);
            return;
          case 10:
            callback([{
              text: '中文',
              range: { start: { x: 20, y: 10 }, end: { x: 23, y: 10 } },
              activate() {
                if (loadingId === -1) {
                  setLang('zh');
                  setReadme();
                }
              },
            }]);
          return;
          default:
            callback(undefined);
        }
      } else {
        switch (bufferLineNumber) {
          case 3:
            callback([{
              text: 'Conventional Commits',
              range: { start: { x: 62, y: 3 }, end: { x: 81, y: 3 } },
              activate() {
                window.open('https://www.conventionalcommits.org/', '_blank');
              },
            }]);
            return;
          case 8:
            callback([{
              text: 'https://github.com/hsuanxyz/commit-gpt',
              range: { start: { x: 18, y: 8 }, end: { x: 55, y: 8 } },
              activate() {
                window.open('https://github.com/hsuanxyz/commit-gpt', '_blank');
              },
            }]);
            return;
          case 10:
            callback([{
              text: 'English',
              range: { start: { x: 10, y: 10 }, end: { x: 16, y: 10 } },
              activate() {
                if (loadingId === -1) {
                  setLang('en');
                  setReadme();
                }
              },
            }]);
            return;
          default:
            callback(undefined);
        }
      }
      callback(undefined);
    },
  });

  const runCommand = async (text: string) => {
    const command = text.trim();
    if (wordsCount(command) < 3) {
      return;
    }
    term.writeln('');
    loading();
    const response = await fetch('/api/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: command,
        user: randomId,
      }),
    });
    let data;
    let error = '';
    let listOfCommit: string[] = [];

    try {
      data = await response.json();
      loading(false);
    } catch (e) {
      loading(false);
      error = `${chalk.red('✖')} Request error\r\n`;
      if (e instanceof Error) {
        error += e.message.trim();
      }
    }

    if (data) {
      try {
        let triedArr = JSON.parse(data.text.trim());
        if (typeof triedArr === 'string') {
          triedArr = JSON.parse(triedArr);
        }

        if (Array.isArray(triedArr)) {
          listOfCommit = triedArr.filter((e) => typeof e === 'string' && !!e);
        }
        if (listOfCommit.length === 0) {
          error = `${chalk.red('✖')} Failed to complete, please check the input or retry.`;
        }
      } catch (e) {
        error = `${chalk.red('✖')} Parse result failure\r\n`;
        if (e instanceof Error) {
          error += e.message.trim();
        }
      }
    }

    if (listOfCommit.length) {
      if (lang === 'en') {
        term.writeln(`${chalk.green('✔')} The GPT provides the following suggestions (click to copy to clipboard)`);
      } else if (lang === 'zh') {
        term.writeln(`${chalk.green('✔')} GPT 提供了下面几条建议 (单击拷贝到剪切板)`);
      }
      term.write('\r\n  ');
      term.writeln(listOfCommit.map((e) => chalk.hex('#c0c0c0').italic(e)).join('\r\n  '));
    } else {
      term.writeln(`\x1b[31;1m${error}\x1b[0m`);
    }
    prompt();
  };

  term.onData((e) => {
    if (loadingId !== -1) {
      return;
    }
    switch (e) {
      case '\x1b[A': // Cursor Up
        if (stack[stackIndex]) {
          term.write('\x1b[2K\r> ');
          term.write(stack[stackIndex] || '');
          prevStackIndex();
        }
        break;
      case '\x1b[B': // Cursor Down
        if (stack[stackIndex]) {
          term.write('\x1b[2K\r> ');
          term.write(stack[stackIndex] || '');
          nextStackIndex();
        }
        break;
      case '\u0003': // Ctrl+C
        term.write('^C');
        prompt();
        break;
      case '\r': // Enter
        runCommand(input);
        pushToStack(input);
        input = '';
        break;
      case '\u007F': // Backspace (DEL)
        // Do not delete the prompt
        // @ts-ignore
        if (term._core.buffer.x > 2) {
          term.write('\b \b');
          if (input.length > 0) {
            input = input.substr(0, input.length - 1);
          }
        }
        break;
      default: // Print all other characters for demo
        if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
          input += e;
          term.write(e);
        }
    }
  });

  return term;
};

export const Terminal: FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import('xterm').Terminal | null>(null);

  useEffect(() => {
    const init = async () => {
      if (hostRef.current) {
        termRef.current?.dispose();
        termRef.current = await initTerminal(hostRef.current);
      }
    };
    init();
  }, []);

  return <div className="container flex-1" ref={hostRef} />;
};
