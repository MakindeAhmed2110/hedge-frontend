import type { ReactNode } from "react";

type VaultInfoChipProps = {
  label: string;
  accent?: boolean;
  strong?: boolean;
};

export function VaultInfoChip({ label, accent, strong }: VaultInfoChipProps) {
  return (
    <span
      className={
        accent
          ? "vault-info-chip vault-info-chip--accent"
          : strong
            ? "vault-info-chip vault-info-chip--strong"
            : "vault-info-chip"
      }>
      {label}
    </span>
  );
}

export function VaultChipRow({ children }: { children: ReactNode }) {
  return <div className="vault-chip-row">{children}</div>;
}
