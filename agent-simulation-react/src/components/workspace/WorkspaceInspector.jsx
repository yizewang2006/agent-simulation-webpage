import { ClipboardPen } from 'lucide-react';
import styles from '../../styles/3rd-gen/simulation.module.css';

export default function WorkspaceInspector({ children, title = 'Inspector' }) {
  return (
    <aside className={`${styles.sidePanel} ${styles.workspaceSidePanel}`}>
      <header className={styles.panelHeader}>
        <ClipboardPen className={styles.panelTitleIcon} size={20} aria-hidden="true" />
        <h2 className={styles.panelTitle}>{title}</h2>
      </header>
      {children}
    </aside>
  );
}
