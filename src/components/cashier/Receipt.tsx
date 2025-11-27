// src/components/cashier/Receipt.tsx
import { Receipt } from "@/types";
import { StorageService } from "@/lib/storage";

interface ReceiptProps {
  receipt: Receipt;
}

const ReceiptComponent: React.FC<ReceiptProps> = ({ receipt }) => {
  const storage = new StorageService();
  const settings = storage.getSettings();

  const styles = {
    page: {
      width: "72mm",
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "10px",
      lineHeight: "1.4",
      color: "#000",
      backgroundColor: "#fff",
      padding: "5mm",
    },
    header: {
      textAlign: "center" as const,
      marginBottom: "5px",
    },
    h1: {
      fontSize: "14px",
      fontWeight: "bold" as const,
      margin: 0,
    },
    p: {
      margin: 0,
    },
    hr: {
      borderTop: "1px dashed #000",
      margin: "5px 0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
    },
    th: {
      textAlign: "left" as const,
      borderBottom: "1px dashed #000",
      padding: "2px 0",
    },
    td: {
      padding: "2px 0",
    },
    total: {
      textAlign: "right" as const,
      fontWeight: "bold" as const,
    },
    footer: {
      textAlign: "center" as const,
      marginTop: "5px",
    },
  };

  // 42 columns for Font A
  const maxCharsPerLine = 42;

  const formatLine = (left: string, right: string) => {
    const spaces = maxCharsPerLine - left.length - right.length;
    return `${left}${" ".repeat(Math.max(0, spaces))}${right}`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        {settings.receiptHeader && <p style={styles.p}>{settings.receiptHeader}</p>}
        <p style={styles.p}>Receipt ID: {receipt.id}</p>
        <p style={styles.p}>Date: {new Date(receipt.date).toLocaleString()}</p>
        <p style={styles.p}>Cashier: {receipt.employeeName}</p>
      </div>
      <hr style={styles.hr} />
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Item</th>
            <th style={{ ...styles.th, textAlign: "center" }}>Qty</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item) => (
            <tr key={item.id}>
              <td style={styles.td}>{item.productName}</td>
              <td style={{ ...styles.td, textAlign: "center" }}>{item.quantity}</td>
              <td style={{ ...styles.td, textAlign: "right" }}>${item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr style={styles.hr} />
      <div>
        <p style={styles.total}>{formatLine("Subtotal:", `$${receipt.subtotal.toFixed(2)}`)}</p>
        <p style={styles.total}>{formatLine("Tax:", `$${receipt.tax.toFixed(2)}`)}</p>
        <p style={{...styles.total, fontSize: "12px"}}>{formatLine("Total:", `$${receipt.total.toFixed(2)}`)}</p>
      </div>
      <hr style={styles.hr} />
      {settings.receiptFooter && (
        <div style={styles.footer}>
          <p style={styles.p}>{settings.receiptFooter}</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptComponent;
