export default function Loading() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Loading...</h1>
      <div className="animate-pulse">
        <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="h-4 w-1/2 rounded bg-gray-200"></div>
      </div>
    </div>
  );
}
