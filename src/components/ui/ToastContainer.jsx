"use client";

import { useEffect } from "react";
import useUIStore from "../../stores/uiStore";

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  const getToastStyles = () => {
    const baseStyles =
      "p-4 rounded-lg shadow-lg w-full transform transition-all duration-300 ease-in-out animate-in slide-in-from-right";

    switch (toast.type) {
      case "success":
        return `${baseStyles} bg-green-50 border border-green-200 text-green-800`;
      case "error":
        return `${baseStyles} bg-red-50 border border-red-200 text-red-800`;
      case "warning":
        return `${baseStyles} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      default:
        return `${baseStyles} bg-blue-50 border border-blue-200 text-blue-800`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{getIcon()}</span>
        </div>
        <div className="ml-3 w-full flex-1">
          {toast.title && <p className="text-sm font-medium">{toast.title}</p>}
          <p className="text-sm">{toast.message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  );
}
