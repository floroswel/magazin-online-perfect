import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MokkaOrangePriceProps {
  price: number;
  months?: number;
}

export default function MokkaOrangePrice({ price, months = 3 }: MokkaOrangePriceProps) {
  const monthly = (price / months).toFixed(2);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-mokka/5 border border-mokka/20 rounded-lg p-3 cursor-help">
            <p className="text-sm font-medium text-mokka">
              💳 sau de la <span className="font-bold">{monthly} lei/lună</span> în {months} rate fără dobândă prin{" "}
              <span className="font-bold">Mokka</span>
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">Plătește în rate fără card cu Mokka. Aprobare instant, fără birocrație.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
