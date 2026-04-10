export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Carregando..." aria-busy="true" className="space-y-6">
      {/* Page title */}
      <div className="h-8 w-40 bg-[#E8EDED] rounded-md animate-pulse" />
      {/* Alert placeholder */}
      <div className="h-12 w-full bg-[#E8EDED] rounded-md animate-pulse" />
      {/* Cost widget placeholder */}
      <div className="h-16 w-full bg-white rounded-md animate-pulse border border-[#E8EDED]" />
      {/* Kanban: 5 columns */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <div className="h-6 w-24 bg-[#E8EDED] rounded-md animate-pulse" />
            {Array.from({ length: 3 }).map((_, card) => (
              <div key={card} className="h-20 w-full bg-white rounded-md animate-pulse border border-[#E8EDED]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
