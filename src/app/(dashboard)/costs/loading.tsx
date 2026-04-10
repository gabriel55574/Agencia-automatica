export default function CostsLoading() {
  return (
    <div role="status" aria-label="Carregando..." aria-busy="true" className="max-w-4xl space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-[#E8EDED] rounded-md animate-pulse" />
        <div className="h-10 w-32 bg-[#E8EDED] rounded-md animate-pulse" />
      </div>
      {/* Total amount */}
      <div className="space-y-1">
        <div className="h-4 w-24 bg-[#E8EDED] rounded-md animate-pulse" />
        <div className="h-7 w-20 bg-[#E8EDED] rounded-md animate-pulse" />
      </div>
      {/* Table skeleton */}
      <div className="space-y-0">
        <div className="h-10 w-full bg-[#E8EDED] rounded-t-md animate-pulse" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 w-full bg-white animate-pulse border-b border-[#E8EDED]" />
        ))}
      </div>
    </div>
  )
}
