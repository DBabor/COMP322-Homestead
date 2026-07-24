interface DataListProps {
  items: any[];
}

export default function DataList({ items }: DataListProps) {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-3">Saved Data</h2>
      {items.length === 0 ? (
        <p className="text-gray-500">No data found.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="p-3 bg-white shadow rounded border border-gray-200">
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}