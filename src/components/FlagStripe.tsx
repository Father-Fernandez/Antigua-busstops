export default function FlagStripe() {
  return (
    <div className="flex h-1.5 w-full" aria-hidden="true">
      <span className="flex-1 bg-flag-500" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-brand-500" />
      <span className="flex-1 bg-ink" />
      <span className="flex-1 bg-sun-500" />
    </div>
  );
}
