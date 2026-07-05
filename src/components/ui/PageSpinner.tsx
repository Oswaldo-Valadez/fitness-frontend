export default function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Cargando">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
    </div>
  )
}
