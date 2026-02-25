# Portfolio — TinyCore-style architecture

SOLID-oriented layout so you can extend commands, viewers, and the FS without touching core code.

## Core abstractions

- **`core/types/`** — Interfaces: `ICommand`, `IVirtualFilesystem`, `IWindowHost`, `ViewerProps` / `ViewerComponent`.
- **`core/fs/`** — `VirtualFilesystem` (in-memory tree). Extend the default tree in `defaultFs.ts` (add files under `/home/zigzalgo`, `/etc`, etc.).
- **`core/commands/`** — `CommandRegistry` and concrete commands. New command = new class implementing `ICommand`, then `registry.register(new MyCommand())` in `createCommandRegistry()`.
- **`core/viewers/`** — `ViewerRegistry` maps window type / MIME to React viewers. New viewer = new component implementing `ViewerProps`, then `viewerRegistry.registerType('myType', MyViewer)` or `registerMime('image/svg+xml', SvgViewer)`.
- **`state/WindowManagerState.ts`** — Reducer for open/close/focus/resize/minimize/maximize. No need to change unless you add new window actions.

## Easter eggs

- **Commands:** Implement in the command’s `execute()`. Example: `uname` in `core/commands/commands/uname.ts` sometimes returns meme lines instead of real `uname`.
- **FS:** You can put “magic” files (e.g. `/etc/motd` that changes, or special content when read).
- **New easter eggs:** Add a new command, or wrap an existing command in a decorator that sometimes alters output.

## Adding a new command

1. Create `core/commands/commands/mycmd.ts` implementing `ICommand` (name, optional description, `execute(args, context)`).
2. In `core/commands/index.ts`, `import { MyCmd } from './commands/mycmd'` and `registry.register(new MyCmd())`.

## Adding a new viewer (e.g. SVG, code)

1. Create a component in `components/viewers/` that accepts `ViewerProps` and renders `payload.url` or `payload.text`.
2. Register it: `viewerRegistry.registerType('svg', SvgViewer)` or `registerMime('image/svg+xml', SvgViewer)`.
3. If needed, extend `ViewerRegistry.mimeToWindowType()` in `core/viewers/ViewerRegistry.ts` for your MIME so `open <file>` picks the right window type.

## Sandbox

- No network: all content is from the in-memory FS or blob URLs created from it.
- To add “download” or “export” later, keep them as in-browser only (e.g. create blob and `URL.createObjectURL` / save link) so the sandbox property is preserved.
