export default function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-black/25 text-white text-[11px] px-3 py-1 rounded-full">
        {label}
      </div>
    </div>
  );
}
