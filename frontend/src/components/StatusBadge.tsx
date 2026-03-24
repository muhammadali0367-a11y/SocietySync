interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  defaulter: "bg-red-50 text-red-700 border-red-200",
  blocked: "bg-gray-100 text-gray-700 border-gray-300",
  inactive: "bg-gray-50 text-gray-500 border-gray-200",
  partially_paid: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = statusStyles[status] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {status.replace("_", " ")}
    </span>
  );
}
