// Base https://github.com/xtermjs/xterm.js/blob/d6599bc048/addons/xterm-addon-web-links/src/WebLinksAddon.ts

import { Terminal, ITerminalAddon, IDisposable } from 'xterm';
import { ILinkProviderOptions, CommitLinkProvider } from './CommitLinkProvider';


const strictUrlRegex = /(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\(.*\))?: .*/;


function handleLink(event: MouseEvent, commit: string): void {
  window.navigator.clipboard.writeText(commit);
}

export class CommitLinksAddon implements ITerminalAddon {
  private _terminal: Terminal | undefined;
  private _linkProvider: IDisposable | undefined;

  constructor(
    private _handler: (event: MouseEvent, uri: string) => void = handleLink,
    private _options: ILinkProviderOptions = {}
  ) {
  }

  public activate(terminal: Terminal): void {
    this._terminal = terminal;
    const options = this._options as ILinkProviderOptions;
    const regex = options.urlRegex || strictUrlRegex;
    this._linkProvider = this._terminal.registerLinkProvider(new CommitLinkProvider(this._terminal, regex, this._handler, options));
  }

  public dispose(): void {
    this._linkProvider?.dispose();
  }
}
