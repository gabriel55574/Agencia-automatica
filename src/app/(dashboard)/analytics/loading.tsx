export default function AnalyticsLoading() {
  return (
    <div role="status" aria-label="Carregando..." aria-busy="true" className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-8 w-32 bg-[#E8EDED] rounded-md animate-pulse" />
        <div className="h-4 w-64 bg-[#E8EDED] rounded-md animate-pulse" />
      </div>
      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-md animate-pulse border border-[#E8EDED]" />
        ))}
      </div>
      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-48 bg-white rounded-md animate-pulse border border-[#E8EDED]" />
        <div className="h-48 bg-white rounded-md animate-pulse border border-[#E8EDED]" />
      </div>
    </div>
  )
}
