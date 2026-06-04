type TradeToastProps = {
  visible: boolean;
  status: "processing" | "success" | "error";
  message?: string | null;
};

export function TradeToast({ visible, status, message }: TradeToastProps) {
  if (!visible) return null;

  const bg =
    status === "success"
      ? "bg-emerald-600"
      : status === "error"
        ? "bg-red-600"
        : "bg-hedge-primary";

  return (
    <div
      className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg ${bg}`}>
      {message ??
        (status === "processing"
          ? "Processing…"
          : status === "success"
            ? "Success"
            : "Something went wrong")}
    </div>
  );
}
