import { createElement } from 'react';
import InlineNameEdit from './InlineNameEdit.jsx';
import styles from '../../styles/3rd-gen/simulation.module.css';

export default function ExplorerEntry({
  children,
  details,
  name,
  type,
  Icon,
  subtitle,
  trimmedId,
  onRename,
}) {
  return (
    <div className={styles.explorerEntry}>
      <div className={styles.explorerEntryMain}>
        <div className={styles.explorerEntryInfo}>
          {createElement(Icon, { size: 17, 'aria-hidden': true })}
          <span>
            <span className={styles.explorerEntryTitleRow}>
              {onRename ? (
                <InlineNameEdit
                  value={name}
                  onCommit={onRename}
                  fallback={`Untitled ${type}`}
                  ariaLabel={`${type} name`}
                  className={styles.explorerEntryNameInput}
                />
              ) : (
                <strong>{name}</strong>
              )}
              {trimmedId && <small>{trimmedId}</small>}
            </span>
            <small>{subtitle || type}</small>
          </span>
        </div>

        {children}
      </div>

      {details}
    </div>
  );
}
