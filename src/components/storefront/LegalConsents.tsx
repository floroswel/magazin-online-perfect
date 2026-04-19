import { Link } from "react-router-dom";

export type LegalConsentsState = {
  terms: boolean;
  privacy: boolean;
  cookies: boolean;
  returns: boolean;
};

export const EMPTY_CONSENTS: LegalConsentsState = {
  terms: false,
  privacy: false,
  cookies: false,
  returns: false,
};

export const allConsentsAccepted = (c: LegalConsentsState) =>
  c.terms && c.privacy && c.cookies && c.returns;

const ITEMS: { key: keyof LegalConsentsState; label: string; href: string }[] = [
  { key: "terms",    label: "Termenii și Condițiile",         href: "/page/termeni-conditii" },
  { key: "privacy",  label: "Politica de Confidențialitate",  href: "/page/politica-de-confidentialitate" },
  { key: "cookies",  label: "Politica de Cookies",            href: "/page/politica-cookies" },
  { key: "returns",  label: "Politica de Retur",              href: "/page/politica-retur" },
];

interface Props {
  value: LegalConsentsState;
  onChange: (next: LegalConsentsState) => void;
  idPrefix?: string;
  compact?: boolean;
}

export default function LegalConsents({ value, onChange, idPrefix = "lc", compact }: Props) {
  return (
    <div className={`space-y-2 ${compact ? "" : "bg-card border border-border rounded-md p-4"}`}>
      {ITEMS.map((it) => {
        const id = `${idPrefix}-${it.key}`;
        const checked = value[it.key];
        return (
          <label
            key={it.key}
            htmlFor={id}
            className="flex items-start gap-2 text-sm cursor-pointer leading-snug"
          >
            <input
              id={id}
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange({ ...value, [it.key]: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-primary shrink-0"
              required
            />
            <span className="text-foreground/90">
              Am luat la cunoștință de{" "}
              <Link to={it.href} className="text-primary underline font-medium">
                {it.label}
              </Link>.
            </span>
          </label>
        );
      })}
    </div>
  );
}
