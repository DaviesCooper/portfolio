import { MIME_APPLICATION_OCTET_STREAM, MIME_APPLICATION_PDF, MIME_TEXT_PLAIN, MIME_TEXT_MARKDOWN } from '../types/mimeTypes';
import type { VfsNode } from '../types/filesystem';

/**
 * Default virtual filesystem for the portfolio — Linux FHS layout with
 * easter eggs that reference Cooper as a person (no projects).
 * @param commandNames - If provided, /bin is populated with empty binary files for each (registered commands).
 */
export function createDefaultFs(commandNames?: string[]): VfsNode {
  const root: VfsNode = {
    kind: 'directory',
    name: '',
    children: new Map(),
  };

  // --- Home and user content ---
  const home = dir('home');
  const user = dir('cooper');
  home.children!.set('cooper', user);

  const projectsDir = dir('projects');
  user.children!.set('Resume', fileFromUrl('Resume', MIME_APPLICATION_PDF, '/resume/Resume.pdf'));
  user.children!.set('About', fileFromUrl('About', MIME_TEXT_MARKDOWN, '/about/About.md'));
  projectsDir.children!.set('Genetic_Stippling', fileFromUrl('Genetic_Stippling', MIME_TEXT_MARKDOWN, '/genetic_stippling/Genetic_Stippling.md'));
  user.children!.set('projects', projectsDir);

  // --- /etc (classic Linux config files) ---
  const etc = dir('etc');
  etc.children!.set('hostname', file('hostname', MIME_TEXT_PLAIN, 'wildroseplains\n'));
  etc.children!.set('os-release', file('os-release', MIME_TEXT_PLAIN, [
    'NAME="consciousnOS"',
    'VERSION="33"',
    'ID=cooperos',
    'VERSION_ID=33',
    'PRETTY_NAME="consciousnOS 33 (Cooper Davies)"',
    'HOME_URL="Calgary, AB"',
  ].join('\n') + '\n'));
  etc.children!.set('passwd', file('passwd', MIME_TEXT_PLAIN, [
    'root:x:0:0:root:/root:/bin/bash',
    'cooper:x:1000:1000:Cooper Davies:/home/cooper:/bin/bash',
  ].join('\n') + '\n'));
  etc.children!.set('group', file('group', MIME_TEXT_PLAIN, [
    'root:x:0:',
    'cooper:x:1000:',
  ].join('\n') + '\n'));
  etc.children!.set('shells', file('shells', MIME_TEXT_PLAIN, '/bin/sh\n/bin/bash\n'));
  etc.children!.set('issue', file('issue', MIME_TEXT_PLAIN, 'consciousnOS 33 wildroseplains \\n \\l\n'));
  etc.children!.set('motd', file('motd', MIME_TEXT_PLAIN, "Cooper's machine. Type 'help' for commands.\n"));

  // --- /bin (empty binaries for each registered command) ---
  const bin = dir('bin');
  if (commandNames) {
    for (const name of commandNames) {
      bin.children!.set(name, binary(name));
    }
  }
  bin.children!.set('sh', binary('sh'));
  bin.children!.set('bash', binary('bash'));

  // --- /sbin (common system binaries as placeholders) ---
  const sbin = dir('sbin');
  for (const name of ['init', 'getty', 'mount', 'umount', 'shutdown', 'reboot', 'fsck', 'ifconfig', 'ip', 'route', 'udevd']) {
    sbin.children!.set(name, binary(name));
  }

  // --- /usr hierarchy ---
  const usr = dir('usr');
  usr.children!.set('bin', dir('bin'));
  usr.children!.set('lib', dir('lib'));
  usr.children!.set('lib64', dir('lib64'));
  usr.children!.set('share', dir('share'));
  usr.children!.set('local', dir('local'));
  usr.children!.set('sbin', dir('sbin'));
  usr.children!.set('include', dir('include'));
  usr.children!.set('src', dir('src'));

  // --- /var hierarchy ---
  const varDir = dir('var');
  const varLog = dir('log');
  varLog.children!.set('syslog', file('syslog', MIME_TEXT_PLAIN, [
    'Feb 22 12:00:00 wildroseplains kernel: [    0.000000] consciousnOS 33 #33-Davies',
    'Feb 22 12:00:01 wildroseplains init: Flip phone synced. No smart device.',
    'Feb 22 12:00:02 wildroseplains run: Still waiting for snowboarding friend to strap in...',
  ].join('\n') + '\n'));
  varLog.children!.set('wtmp', binary('wtmp'));
  varLog.children!.set('lastlog', binary('lastlog'));
  varDir.children!.set('log', varLog);
  varDir.children!.set('cache', dir('cache'));
  varDir.children!.set('tmp', dir('tmp'));
  varDir.children!.set('run', dir('run'));
  varDir.children!.set('lib', dir('lib'));
  varDir.children!.set('spool', dir('spool'));
  varDir.children!.set('mail', dir('mail'));

  // --- /proc (pseudo-files; read by uname, etc.) ---
  const proc = dir('proc');
  proc.children!.set('version', file('version', MIME_TEXT_PLAIN,
    'consciousnOS 33 (cooper@wildroseplains) (gcc 12.2.0) #33-Davies Sun Sep 27 04:00:00 UTC 1992 xBrain\n'));
  proc.children!.set('cpuinfo', file('cpuinfo', MIME_TEXT_PLAIN, [
    'processor\t: XBrain',
    'model name\t: Cooper Davies',
    'cpu MHz\t\t: 2400.000',
  ].join('\n') + '\n'));
  proc.children!.set('meminfo', file('meminfo', MIME_TEXT_PLAIN, [
    'MemTotal:        2048 tB',
    'MemFree:         2048 tB',
    'MemAvailable:    2048 tB',
  ].join('\n') + '\n'));

  const secondsSinceStartup = Math.floor(Date.UTC(1992, 8, 27) / 1000);
  proc.children!.set('uptime', file('uptime', MIME_TEXT_PLAIN, `${secondsSinceStartup} ${secondsSinceStartup/2}\n`));
  proc.children!.set('loadavg', file('loadavg', MIME_TEXT_PLAIN, '0.12 0.08 0.06 1/42 1234\n'));

  // --- Root-level FHS directories ---
  root.children!.set('bin', bin);
  root.children!.set('boot', dir('boot'));
  root.children!.set('dev', dir('dev'));
  root.children!.set('etc', etc);
  root.children!.set('home', home);
  root.children!.set('lib', dir('lib'));
  root.children!.set('lib32', dir('lib32'));
  root.children!.set('lib64', dir('lib64'));
  root.children!.set('libx32', dir('libx32'));
  root.children!.set('media', dir('media'));
  root.children!.set('mnt', dir('mnt'));
  root.children!.set('opt', dir('opt'));
  root.children!.set('proc', proc);
  root.children!.set('root', dir('root'));
  root.children!.set('run', dir('run'));
  root.children!.set('sbin', sbin);
  root.children!.set('srv', dir('srv'));
  root.children!.set('sys', dir('sys'));
  root.children!.set('tmp', dir('tmp'));
  root.children!.set('usr', usr);
  root.children!.set('var', varDir);

  return root;
}

function dir(name: string): VfsNode {
  return { kind: 'directory', name, children: new Map() };
}

function file(name: string, mimeType: string, content: string): VfsNode {
  return { kind: 'file', name, mimeType, content };
}

function fileFromUrl(name: string, mimeType: string, url: string): VfsNode {
  return { kind: 'file', name, mimeType, url };
}

/** Empty binary (executable placeholder) for /bin. */
function binary(name: string): VfsNode {
  return {
    kind: 'file',
    name,
    mimeType: MIME_APPLICATION_OCTET_STREAM,
    base64: '',
    content: 'you thought this was an actual binary? This entire filesystem is virtual.',
  };
}
