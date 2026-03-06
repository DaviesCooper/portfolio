import styles from './BlueScreen.module.css';

export interface BlueScreenProps {
  onRestore?: () => void;
}

export function BlueScreen({ onRestore }: BlueScreenProps) {
  return (
    <div className={styles.screen} onClick={onRestore} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onRestore?.()}>
      <div className={styles.content}>
        <p className={styles.main}>
          A problem has been detected and Windows has been shut down to prevent damage to your computer.
        </p>
        <p className={styles.stopName}>ERROR_ON_OTHER_SIDE_OF_KEYBOARD</p>
        <p className={styles.main}>
          If this is the first time you've seen this Stop error screen, restart your computer. If this screen appears again, follow these steps:
        </p>
        <p className={styles.main}>
          Check to make sure any new hardware or software is properly installed. If this is a new installation, ask your hardware or software manufacturer for any Windows updates you might need.
        </p>
        <p className={styles.main}>
          If problems continue, disable or remove any newly installed hardware or software. Disable BIOS memory options such as caching or shadowing. If you need to use Safe Mode to remove or disable components, restart your computer, press F8 to select Advanced Startup Options, and then select Safe Mode.
        </p>
        <p className={styles.tech}>Technical information:</p>
        <p className={styles.stopCode}>*** STOP: 0x00000050 (0xFD0E0000, 0x00000000, 0x8054A2B1, 0x00000000)</p>
        <p className={styles.stopCode}>*** vfsempty.sys - Address FBFE7617 base at FBFE5000, DateStamp 3d6dd67c</p>
        <p className={styles.meme}>You deleted the entire filesystem. You're really trying to break my site aren't you?</p>
        {onRestore && (
          <p className={styles.restore}>Press any key to restore filesystem</p>
        )}
      </div>
    </div>
  );
}
