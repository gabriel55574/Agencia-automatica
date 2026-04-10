export default function ClientsLoading() {
  return (
    <div role="status" aria-label="Carregando..." aria-busy="true" className="space-y-6">
      {/* Header area */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-[#E8EDED] rounded-md animate-pulse" />
        <div className="h-10 w-28 bg-[#E8EDED] rounded-md animate-pulse" />
      </div>
      {/* Card grid: 6 cards in 3x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 w-full bg-white rounded-md animate-pulse border border-[#E8EDED]" />
        ))}
      </div>
    </div>
  )
}
