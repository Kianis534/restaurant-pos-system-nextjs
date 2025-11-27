"use client";
import { useRouter, useParams } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CashierLayout } from "@/components/layout/CashierLayout";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService } from "@/lib/storage";
import { Receipt } from "@/types";
import ReceiptComponent from "@/components/cashier/Receipt";
import { Button } from "@/components/ui/Button";

export default function PreviousBillDetail() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const storage = new StorageService();
  const receipt = storage.getReceipts().find((r) => r.id === id);

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const input = document.getElementById("receipt-content");
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", [79.5, 200]); // Thermal printer paper size
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`receipt-${receipt?.id}.pdf`);
      });
    }
  };

  const renderLayout = () => {
    if (user?.role === "admin") {
      return (
        <AdminLayout>
          <div className="p-4">
            <h1 className="text-2xl font-bold">Previous Bill</h1>
            <p>You do not have permission to view this page.</p>
          </div>
        </AdminLayout>
      );
    } else if (user?.role === "cashier") {
      return (
        <CashierLayout>
          <div className="p-4">
            {receipt ? (
              <div>
                <div id="receipt-content">
                  <ReceiptComponent receipt={receipt} />
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button onClick={handlePrint}>Print</Button>
                  <Button onClick={handleDownload}>Download PDF</Button>
                </div>
              </div>
            ) : (
              <p>Receipt not found.</p>
            )}
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
