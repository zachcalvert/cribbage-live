interface Props {
  isConnected: boolean;
}

export default function ConnectionStatus({ isConnected }: Props) {
  if (isConnected) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />
      Reconnecting...
    </div>
  );
}
