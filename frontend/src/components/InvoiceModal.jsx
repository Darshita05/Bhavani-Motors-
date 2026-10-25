import React, { useRef } from "react";
import logo from "../assets/images/logo.png";
import {
  FiPrinter,
  FiDownload,
  FiX,
  FiFileText,
  FiPhone,
  FiMail,
  FiMapPin,
  FiTool,
  FiUser,
  FiSend,
  FiCheckCircle,
  FiBox,
} from "react-icons/fi";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { showToast } from "./ToasterService";
import "../style/InvoiceModal.css";

// Helper: Convert number to Indian currency words
const numberToWordsIndian = (num) => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  num = Math.round(Number(num) || 0);
  if (num === 0) return "Zero Rupees Only";

  const n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";

  let str = "";
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
  str +=
    Number(n[5]) !== 0
      ? (str !== "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
      : "";

  return `Rupees ${str.trim()} Only`;
};

const InvoiceModal = ({ isOpen, onClose, jobCard }) => {
  const invoicePrintRef = useRef(null);

  if (!isOpen || !jobCard) return null;

  const customer =
    typeof jobCard.customerId === "object" && jobCard.customerId !== null
      ? jobCard.customerId
      : {};

  const vehicle =
    typeof jobCard.carId === "object" && jobCard.carId !== null
      ? jobCard.carId
      : {};

  const assignedStaff =
    typeof jobCard.assignedTo === "object" && jobCard.assignedTo !== null
      ? jobCard.assignedTo
      : {};

  const workList = jobCard.workToBeDone || [];
  const itemsList = jobCard.itemsUsed || [];

  const labourTotal = workList.reduce(
    (total, item) => total + Number(item.cost || 0),
    0
  );

  const partsTotal = itemsList.reduce((total, item) => {
    const rate =
      item.rate !== undefined && item.rate !== null
        ? Number(item.rate)
        : Number(
            item.itemId?.sellingPrice ||
              item.itemId?.price ||
              item.itemId?.rate ||
              0
          );
    const amount =
      item.amount !== undefined && item.amount !== null
        ? Number(item.amount)
        : Number(item.quantity || 0) * rate;
    return total + amount;
  }, 0);

  const grossSubtotal = labourTotal + partsTotal;
  const discount = Number(jobCard.discount || 0);
  const tax = Number(jobCard.tax || 0);
  const grandTotal = Math.max(0, grossSubtotal - discount + tax);

  const invoiceNo = `INV-${jobCard.jobCardNumber || "2026-001"}`;
  const invoiceDate = new Date(jobCard.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const customerName =
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    customer.name ||
    "Customer";

  const customerPhone =
    customer.phoneNumber || customer.phone || "Not Provided";

  const vehiclePlate =
    vehicle.registrationNo ||
    vehicle.carNumber ||
    vehicle.numberPlate ||
    "NO PLATE";

  const vehicleModel =
    `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Vehicle";

  const formatMoney = (val) => {
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  };

  // ==========================================
  // DIRECT HIGH-RES PDF DOWNLOAD (HTML2CANVAS + JSPDF)
  // 100% Reliable, Pixel-Perfect Vector/Canvas PDF
  // ==========================================
  const handleDownloadPDF = async () => {
    const element = invoicePrintRef.current;
    if (!element) {
      showToast.error("Invoice element not found");
      return;
    }

    try {
      showToast.info("Generating PDF invoice...");

      // Render the invoice element to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution (2x retina)
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210; // A4 standard width in mm
      const pageHeight = 297; // A4 standard height in mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        // Fits perfectly on single A4 sheet
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight, undefined, "FAST");
      } else {
        // Handle multi-page if content overflows A4
        let position = 0;
        let heightLeft = imgHeight;

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, "FAST");
          heightLeft -= pageHeight;
        }
      }

      const cleanFileName = `Invoice_${jobCard.jobCardNumber || "BhavaniMotors"}.pdf`;
      pdf.save(cleanFileName);
      showToast.success("Invoice PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF Download error:", err);
      showToast.error("Failed to generate PDF: " + (err?.message || "Please try again"));
    }
  };

  // ==========================================
  // BULLETPROOF PRINT HANDLER (Dedicated Popup Document)
  // ==========================================
  const handlePrint = () => {
    const element = invoicePrintRef.current;
    if (!element) return;

    try {
      const printWindow = window.open("", "_blank", "width=850,height=900");
      if (!printWindow) {
        window.print();
        return;
      }

      const styles = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; padding: 20px; color: #0f172a; }
        .invoice-sheet { width: 100%; max-width: 100%; padding: 0; box-shadow: none; }
        .inv-header { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 14px; }
        .inv-brand { display: flex; gap: 14px; align-items: flex-start; }
        .inv-logo { height: 48px; width: auto; object-fit: contain; }
        .inv-brand-details h1 { font-size: 20px; font-weight: 800; color: #1e3a8a; margin: 0; }
        .inv-tagline { font-size: 10px; font-weight: 600; color: #475569; margin: 2px 0; }
        .inv-address, .inv-contact { font-size: 9px; color: #64748b; margin: 2px 0; }
        .inv-tax-badge-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; min-width: 200px; text-align: right; }
        .tax-invoice-heading { font-size: 13px; font-weight: 800; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 3px; margin-bottom: 4px; text-align: center; }
        .inv-meta-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
        .meta-label { color: #64748b; }
        .meta-val { color: #0f172a; font-weight: 600; }
        .meta-val.highlight { color: #2563eb; font-weight: 700; }
        .inv-divider-line { height: 2px; background: #e2e8f0; margin: 10px 0 14px; }
        .inv-two-col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .inv-info-card { border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; overflow: hidden; }
        .inv-card-header { background: #f1f5f9; padding: 5px 10px; font-size: 10px; font-weight: 700; color: #334155; border-bottom: 1px solid #e2e8f0; }
        .inv-card-body { padding: 8px 10px; font-size: 10px; display: flex; flex-direction: column; gap: 3px; }
        .customer-name-large { font-size: 13px; font-weight: 700; color: #0f172a; }
        .vehicle-grid .v-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
        .v-lbl { color: #64748b; }
        .inv-plate-chip { background: #0f172a; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        .inv-section-title { background: #f8fafc; border-left: 3px solid #2563eb; padding: 3px 6px; margin: 10px 0 4px; font-size: 10px; font-weight: 700; color: #1e293b; }
        .inv-section-title.parts { border-left-color: #10b981; }
        .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
        .inv-table th { background: #f1f5f9; color: #334155; padding: 5px 6px; font-weight: 700; border: 1px solid #cbd5e1; text-align: left; }
        .inv-table td { padding: 5px 6px; border: 1px solid #e2e8f0; color: #1e293b; }
        .subtotal-row { background: #f8fafc; }
        .subtotal-row td { border-top: 2px solid #cbd5e1; font-weight: 700; }
        .parts-subtotal td { color: #047857; font-weight: 700; }
        .inv-summary-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 12px; margin-top: 10px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #fafbfe; }
        .inv-words-box { display: flex; flex-direction: column; gap: 3px; font-size: 10px; }
        .words-label { color: #64748b; font-weight: 600; }
        .words-text { font-size: 11px; color: #1e3a8a; font-weight: 700; background: #eff6ff; padding: 4px 6px; border-radius: 4px; border-left: 3px solid #2563eb; }
        .inv-payment-terms { margin-top: 8px; font-size: 9px; color: #64748b; }
        .inv-payment-terms ul { margin: 3px 0 0; padding-left: 14px; }
        .inv-calculation-box { display: flex; flex-direction: column; gap: 4px; font-size: 10px; }
        .calc-row { display: flex; justify-content: space-between; color: #334155; }
        .calc-row.parts-highlight { color: #047857; font-weight: 600; }
        .gross-row { border-top: 1px dashed #cbd5e1; padding-top: 3px; font-weight: 600; }
        .discount-row { color: #dc2626; }
        .grand-total-row { margin-top: 4px; padding-top: 4px; border-top: 2px solid #0f172a; font-size: 13px; font-weight: 800; color: #0f172a; display: flex; justify-content: space-between; }
        .grand-amount { color: #1e3a8a; }
        .inv-footer-signatures { display: flex; justify-content: space-between; margin-top: 28px; padding-top: 10px; }
        .sig-block { width: 180px; font-size: 10px; color: #475569; }
        .sig-block.text-right { text-align: right; }
        .company-stamp-area { height: 25px; display: flex; align-items: center; justify-content: flex-end; }
        .stamp-text { font-size: 9px; font-weight: 700; color: #1e3a8a; }
        .sig-line { border-bottom: 1px solid #94a3b8; margin-bottom: 3px; }
        .inv-thank-you { margin-top: 16px; text-align: center; font-size: 10px; font-weight: 600; color: #2563eb; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
        @page { size: A4 portrait; margin: 10mm; }
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Invoice_${jobCard.jobCardNumber || "BhavaniMotors"}</title>
            <style>${styles}</style>
          </head>
          <body>
            ${element.outerHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                  window.close();
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Print popup error:", err);
      window.print();
    }
  };

  // ==========================================
  // SHARE ON WHATSAPP
  // ==========================================
  const handleShareWhatsApp = () => {
    const rawPhone = customerPhone.replace(/[^0-9]/g, "");
    const phoneWithCountry =
      rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const message = encodeURIComponent(
      `Hello ${customerName},\n\n` +
        `Your vehicle *${vehicleModel} (${vehiclePlate})* service invoice is ready at *Bhavani Motors*.\n\n` +
        `📄 *Invoice No:* ${invoiceNo}\n` +
        `🛠️ *Job Card Ref:* ${jobCard.jobCardNumber || "-"}\n` +
        `🔧 *Labour Charges:* ${formatMoney(labourTotal)}\n` +
        (partsTotal > 0 ? `📦 *Parts & Materials:* ${formatMoney(partsTotal)}\n` : "") +
        `💵 *Total Amount:* ${formatMoney(grandTotal)}\n` +
        `✅ *Status:* ${jobCard.status || "Completed"}\n\n` +
        `Thank you for choosing Bhavani Motors!\n` +
        `Contact: +91 98765 43210`
    );

    const whatsappUrl = phoneWithCountry
      ? `https://wa.me/${phoneWithCountry}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div
        className="invoice-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL TOP BAR (Hidden in print) */}
        <div className="invoice-modal-top-bar no-print">
          <div className="top-bar-title">
            <FiFileText className="doc-icon" />
            <span>Tax Invoice — {jobCard.jobCardNumber}</span>
          </div>

          <div className="top-bar-actions">
            <button
              type="button"
              className="inv-btn print-btn"
              onClick={handlePrint}
              title="Print Invoice (A4)"
            >
              <FiPrinter /> Print
            </button>

            <button
              type="button"
              className="inv-btn download-btn"
              onClick={handleDownloadPDF}
              title="Download as PDF file"
            >
              <FiDownload /> Download PDF
            </button>

            <button
              type="button"
              className="inv-btn whatsapp-btn"
              onClick={handleShareWhatsApp}
              title="Share Invoice summary on WhatsApp"
            >
              <FiSend /> WhatsApp
            </button>

            <button
              type="button"
              className="inv-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE SHEET (A4 Content) */}
        <div className="invoice-sheet-wrapper">
          <div className="invoice-sheet" ref={invoicePrintRef} id="invoice-sheet">
            {/* COMPANY HEADER */}
            <div className="inv-header">
              <div className="inv-brand">
                <img src={logo} alt="Bhavani Motors" className="inv-logo" />
                <div className="inv-brand-details">
                  <h1>BHAVANI MOTORS</h1>
                  <p className="inv-tagline">
                    Multi-brand Car Care & Advanced Diagnostic Workshop
                  </p>
                  <p className="inv-address">
                    <FiMapPin /> Plot No. 12, GIDC Auto Zone, Ring Road, Surat, Gujarat - 395006
                  </p>
                  <p className="inv-contact">
                    <FiPhone /> +91 98765 43210 &nbsp;|&nbsp; <FiMail /> support@bhavanimotors.com
                  </p>
                </div>
              </div>

              <div className="inv-tax-badge-box">
                <div className="tax-invoice-heading">TAX INVOICE</div>
                <div className="inv-meta-row">
                  <span className="meta-label">Invoice No:</span>
                  <strong className="meta-val highlight">{invoiceNo}</strong>
                </div>
                <div className="inv-meta-row">
                  <span className="meta-label">Date:</span>
                  <span className="meta-val">{invoiceDate}</span>
                </div>
                <div className="inv-meta-row">
                  <span className="meta-label">Job Card Ref:</span>
                  <strong className="meta-val">{jobCard.jobCardNumber || "-"}</strong>
                </div>
                <div className="inv-meta-row">
                  <span className="meta-label">GSTIN:</span>
                  <span className="meta-val font-mono">24AAACB1234F1Z5</span>
                </div>
              </div>
            </div>

            <div className="inv-divider-line" />

            {/* CUSTOMER & VEHICLE DETAILS GRID */}
            <div className="inv-two-col-grid">
              {/* BILL TO */}
              <div className="inv-info-card">
                <div className="inv-card-header">
                  <FiUser /> BILLED TO (CUSTOMER)
                </div>
                <div className="inv-card-body">
                  <strong className="customer-name-large">{customerName}</strong>
                  <p>
                    <FiPhone /> {customerPhone}
                  </p>
                  {customer.email && (
                    <p>
                      <FiMail /> {customer.email}
                    </p>
                  )}
                  {customer.address && (
                    <p>
                      <FiMapPin /> {customer.address}
                    </p>
                  )}
                </div>
              </div>

              {/* VEHICLE & JOB INFO */}
              <div className="inv-info-card">
                <div className="inv-card-header">
                  <FiTool /> VEHICLE & JOB DETAILS
                </div>
                <div className="inv-card-body vehicle-grid">
                  <div className="v-row">
                    <span className="v-lbl">Registration Plate:</span>
                    <span className="inv-plate-chip">{vehiclePlate}</span>
                  </div>
                  <div className="v-row">
                    <span className="v-lbl">Make & Model:</span>
                    <strong>{vehicleModel}</strong>
                  </div>
                  {vehicle.fuelType && (
                    <div className="v-row">
                      <span className="v-lbl">Fuel Type:</span>
                      <span>{vehicle.fuelType}</span>
                    </div>
                  )}
                  {vehicle.mileage && (
                    <div className="v-row">
                      <span className="v-lbl">Odometer:</span>
                      <span>{vehicle.mileage} km</span>
                    </div>
                  )}
                  <div className="v-row">
                    <span className="v-lbl">Technician:</span>
                    <span>{assignedStaff.name || "Master Technician"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLE 1: LABOUR & SERVICES */}
            <div className="inv-section-title">
              <FiTool /> 1. LABOUR & SERVICE CHARGES
            </div>

            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ width: "8%", textAlign: "center" }}>#</th>
                  <th style={{ width: "62%" }}>Service / Task Description</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Status</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {workList.length > 0 ? (
                  workList.map((work, idx) => (
                    <tr key={work._id || idx}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td>
                        <strong>{work.description || "Labour Charge"}</strong>
                        {work.workUpdate && (
                          <span className="sub-note"> ({work.workUpdate})</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="table-status-pill">
                          {work.status || "Completed"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatMoney(work.cost || 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-row">
                      Standard General Service Check
                    </td>
                  </tr>
                )}
                <tr className="subtotal-row">
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    <strong>Labour Subtotal:</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{formatMoney(labourTotal)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* TABLE 2: PARTS & MATERIALS (HIGHLIGHTED) */}
            {itemsList.length > 0 && (
              <>
                <div className="inv-section-title parts" style={{ marginTop: "12px" }}>
                  <FiBox /> 2. SPARE PARTS & CONSUMABLES USED (CHARGES ADDED TO BILL)
                </div>

                <table className="inv-table parts-table">
                  <thead>
                    <tr>
                      <th style={{ width: "8%", textAlign: "center" }}>#</th>
                      <th style={{ width: "47%" }}>Part / Material Name</th>
                      <th style={{ width: "15%", textAlign: "center" }}>Quantity</th>
                      <th style={{ width: "15%", textAlign: "right" }}>Unit Rate (₹)</th>
                      <th style={{ width: "15%", textAlign: "right" }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.map((item, idx) => {
                      const rate =
                        item.rate !== undefined && item.rate !== null
                          ? Number(item.rate)
                          : Number(
                              item.itemId?.sellingPrice ||
                                item.itemId?.price ||
                                0
                            );
                      const amount =
                        item.amount !== undefined && item.amount !== null
                          ? Number(item.amount)
                          : Number(item.quantity || 0) * rate;

                      return (
                        <tr key={item._id || idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>
                            <strong>
                              {item.itemId?.itemName ||
                                item.itemName ||
                                "Spare Part"}
                            </strong>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="part-qty-tag">{item.quantity} Nos</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatMoney(rate)}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: "700" }}>
                            {formatMoney(amount)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="subtotal-row parts-subtotal">
                      <td colSpan="4" style={{ textAlign: "right" }}>
                        <strong>Parts & Materials Subtotal:</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong>{formatMoney(partsTotal)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* FINANCIAL SUMMARY & AMOUNT IN WORDS */}
            <div className="inv-summary-grid">
              <div className="inv-words-box">
                <span className="words-label">Amount in Words:</span>
                <strong className="words-text">
                  {numberToWordsIndian(grandTotal)}
                </strong>

                <div className="inv-payment-terms">
                  <strong>Terms & Conditions:</strong>
                  <ul>
                    <li>30 Days or 1,000 km warranty on labour services.</li>
                    <li>Parts warranty as per manufacturer policy.</li>
                    <li>All disputes subject to Surat jurisdiction.</li>
                  </ul>
                </div>
              </div>

              <div className="inv-calculation-box">
                <div className="calc-row">
                  <span>Labour Subtotal:</span>
                  <strong>{formatMoney(labourTotal)}</strong>
                </div>

                {partsTotal > 0 && (
                  <div className="calc-row parts-highlight">
                    <span>Parts & Materials Total:</span>
                    <strong>+ {formatMoney(partsTotal)}</strong>
                  </div>
                )}

                <div className="calc-row gross-row">
                  <span>Gross Subtotal:</span>
                  <span>{formatMoney(grossSubtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="calc-row discount-row">
                    <span>Discount:</span>
                    <span>- {formatMoney(discount)}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="calc-row">
                    <span>GST / Taxes:</span>
                    <span>+ {formatMoney(tax)}</span>
                  </div>
                )}

                <div className="calc-row grand-total-row">
                  <div className="grand-label">Grand Total Payable:</div>
                  <div className="grand-amount">{formatMoney(grandTotal)}</div>
                </div>
              </div>
            </div>

            {/* SIGNATURE FOOTER */}
            <div className="inv-footer-signatures">
              <div className="sig-block">
                <div className="sig-line" />
                <span>Customer Signature</span>
              </div>

              <div className="sig-block text-right">
                <div className="company-stamp-area">
                  <span className="stamp-text">FOR BHAVANI MOTORS</span>
                </div>
                <div className="sig-line" />
                <span>Authorized Signatory & Stamp</span>
              </div>
            </div>

            <div className="inv-thank-you">
              ★ Thank you for choosing Bhavani Motors for your vehicle service! ★
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
