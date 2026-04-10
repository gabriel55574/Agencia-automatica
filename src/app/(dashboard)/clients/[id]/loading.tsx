export default function ClientProfileLoading() {
  return (
    <div role="status" aria-label="Carregando..." aria-busy="true" className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[#E8EDED] rounded-md animate-pulse" />
          <div className="h-4 w-32 bg-[#E8EDED] rounded-md animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-16 bg-[#E8EDED] rounded-md animate-pulse" />
          <div className="h-9 w-16 bg-[#E8EDED] rounded-md animate-pulse" />
        </div>
      </div>
      {/* Tab bar */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-[#E8EDED] rounded-md animate-pulse" />
        ))}
      </div>
      {/* Content area */}
      <div className="h-64 w-full bg-white rounded-md animate-pulse border border-[#E8EDED]" />
    </div>
  )
}
