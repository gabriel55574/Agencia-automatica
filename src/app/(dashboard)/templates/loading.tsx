export default function TemplatesLoading() {
  return (
    <div role="status" aria-label="Carregando..." aria-busy="true" className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-8 w-32 bg-[#E8EDED] rounded-md animate-pulse" />
        <div className="h-4 w-80 bg-[#E8EDED] rounded-md animate-pulse" />
      </div>
      {/* List items */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-white rounded-md animate-pulse border border-[#E8EDED]" />
      ))}
    </div>
  )
}
