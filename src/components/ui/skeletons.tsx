import { cn } from "@/lib/utils";

const Pulse = ({ className }: { className?: string }) => (
  <div className={cn("bg-muted animate-pulse rounded", className)} />
);

export function ProductCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Pulse className="aspect-square rounded-none" />
      <div className="p-4 space-y-3">
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-3 w-1/2" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-3 w-3 rounded-full" />
          ))}
        </div>
        <Pulse className="h-5 w-1/3" />
        <Pulse className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container py-6">
      <div className="grid md:grid-cols-2 gap-8">
        <Pulse className="aspect-square rounded-lg" />
        <div className="space-y-4">
          <Pulse className="h-8 w-3/4" />
          <Pulse className="h-4 w-1/2" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Pulse key={i} className="h-4 w-4 rounded-full" />
            ))}
          </div>
          <Pulse className="h-10 w-1/3" />
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-5/6" />
          <Pulse className="h-4 w-4/5" />
          <div className="flex gap-3 pt-4">
            <Pulse className="h-12 w-32 rounded-md" />
            <Pulse className="h-12 flex-1 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="container py-6 space-y-4">
      <Pulse className="h-8 w-48" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 border rounded-lg p-4">
          <Pulse className="w-20 h-20 rounded" />
          <div className="flex-1 space-y-2">
            <Pulse className="h-4 w-3/4" />
            <Pulse className="h-3 w-1/4" />
            <Pulse className="h-5 w-1/6" />
          </div>
        </div>
      ))}
      <Pulse className="h-12 w-48 rounded-md ml-auto" />
    </div>
  );
}

export function CategoryPageSkeleton() {
  return (
    <div className="container py-6">
      <Pulse className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-4 w-20" />
          </div>
          <Pulse className="h-3 w-1/2" />
          <Pulse className="h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}
