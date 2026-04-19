import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title?: string;
  description?: string;
  integrationName?: string;
}

/**
 * Banner afișat pe paginile admin care necesită o sursă de date externă
 * sau o configurare suplimentară înainte de a fi funcționale.
 * Folosit în loc de date mock/random pentru a păstra UI-ul curat și onest.
 */
export default function PendingDataBanner({
  title = "Modul în dezvoltare",
  description = "Această secțiune necesită configurare sau o sursă de date externă pentru a fi activă.",
  integrationName,
}: Props) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
      <CardContent className="pt-5 pb-5">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              {title}
            </h3>
            <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-1">
              {description}
            </p>
            {integrationName && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                Necesită integrare: <span className="font-medium">{integrationName}</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
