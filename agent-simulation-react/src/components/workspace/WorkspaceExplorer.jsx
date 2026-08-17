import { ScanSearch } from 'lucide-react';
import styles from '../../styles/3rd-gen/simulation.module.css';

export default function WorkspaceExplorer({ children, title = 'Explorer' }) {
  return (
    <aside className={`${styles.sidePanel} ${styles.workspaceSidePanel}`}>
      <header className={styles.panelHeader}>
        <ScanSearch className={styles.panelTitleIcon} size={20} aria-hidden="true" />
        <h2 className={styles.panelTitle}>{title}</h2>
      </header>
      {children}
    </aside>
  );
}
