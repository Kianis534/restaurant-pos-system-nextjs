"use client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CashierLayout } from "@/components/layout/CashierLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { StorageService } from "@/lib/storage";

export default function PreviousBills() {
  const { user } = useAuth();
  const router = useRouter();
  const storage = new StorageService();
  const receipts = storage.getReceipts();

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const renderLayout = () => {
    if (user?.role === "admin") {
      return (
        <AdminLayout>
          <div className="p-4">
            <h1 className="text-2xl font-bold">Previous Bills</h1>
            <p>You do not have permission to view this page.</p>
          </div>
        </AdminLayout>
      );
    } else if (user?.role === "cashier") {
      return (
        <CashierLayout>
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Previous Bills</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="p-4 border rounded-lg shadow-sm cursor-pointer hover:shadow-md"
                  onClick={() => router.push(`/cashier/previous-bills/${receipt.id}`)}
                >
                  <p className="font-semibold">Receipt ID: {receipt.id}</p>
                  <p>Date: {new Date(receipt.date).toLocaleString()}</p>
                  <p>Total: ${receipt.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </CashierLayout>
      );
    } else {
      router.push("/unauthorized");
      return null;
    }
  };

  return <>{renderLayout()}</>;
}
