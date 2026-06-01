import type { ReactNode } from "react";

export function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
  const valueContent =
    typeof value === "string" ? <span className="summary-text-value">{value}</span> : value;

  return (
    <div className="summary-card">
      <span className="summary-card-label">{label}</span>
      <strong className="summary-card-value">{valueContent}</strong>
    </div>
  );
}
