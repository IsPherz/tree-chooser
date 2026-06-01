export function InfoTooltip({
  label,
  text,
  compact = false,
}: {
  label: string;
  text: string;
  compact?: boolean;
}) {
  const tooltipClassName = compact ? "record-info-content" : "info-tooltip";

  return (
    <span
      className={compact ? "record-info" : "info-button"}
      tabIndex={compact ? undefined : 0}
      aria-label={label}
    >
      i
      <span className={tooltipClassName} role="tooltip">
        {text}
      </span>
    </span>
  );
}
