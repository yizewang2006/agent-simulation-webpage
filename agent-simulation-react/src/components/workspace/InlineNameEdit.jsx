import styles from '../../styles/3rd-gen/simulation.module.css';

export default function InlineNameEdit({
  value,
  onCommit,
  fallback = 'Untitled',
  ariaLabel = 'Name',
  className = styles.inlineNameEdit,
}) {
  function commit(event) {
    const nextValue = event.currentTarget.value.trim() || fallback;
    event.currentTarget.value = nextValue;
    onCommit(nextValue);
  }

  return (
    <input
      key={value}
      className={className}
      type="text"
      defaultValue={value}
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onBlur={commit}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
}
