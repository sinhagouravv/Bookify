import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (payment, user) => {
    try {
        console.log("Generating invoice for:", payment);
        const doc = new jsPDF();

        // Brand Palette
        const brandPrimary = '#4F46E5'; // Indigo 600
        const brandSecondary = '#3730A3'; // Indigo 800
        const accentColor = '#F59E0B'; // Amber 500

        // ---------------------------------------------------------
        // Header Section
        // ---------------------------------------------------------

        // Top colored bar
        doc.setFillColor(brandPrimary);
        doc.rect(0, 0, 210, 40, 'F');

        // "Logo" - Stylized Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Bookifyyy', 15, 26);

        // Tagline
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(224, 231, 255); // Indigo 100
        doc.text('Your World, Curated & Managed.', 15, 33);

        // Invoice Label
        doc.setFontSize(30);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('INVOICE', 195, 28, { align: 'right' });

        // ---------------------------------------------------------
        // Invoice Details & Company Info (Two Columns)
        // ---------------------------------------------------------

        const startY = 55;

        // Left Column - Company Info
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('From:', 15, startY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('Bookifyyy Inc.', 15, startY + 6);
        doc.text('123 Knowledge Avenue', 15, startY + 11);
        doc.text('Tech District, Bangalore 560001', 15, startY + 16);
        doc.text('Email: bookifyyy@gmail.com', 15, startY + 21);
        doc.text('GSTIN: 29AAAAA0000A1Z5', 15, startY + 26);

        // Right Column - Invoice Meta
        const invoiceId = (payment.id || payment.paymentId || 'INV-000').substring(0, 12).toUpperCase();
        const paymentDate = new Date(payment.date || Date.now()).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text('Invoice Details:', 140, startY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);

        // Helper to print key-value pairs aligned
        const printDetail = (label, value, y) => {
            doc.text(`${label}`, 140, y);
            doc.text(`${value}`, 195, y, { align: 'right' });
        };

        printDetail('Invoice No:', `#${invoiceId}`, startY + 6);
        printDetail('Date:', paymentDate, startY + 11);
        printDetail('Status:', payment.status || 'Paid', startY + 16);
        printDetail('Method:', payment.paymentMethod || 'Online', startY + 21);

        // ---------------------------------------------------------
        // Bill To Section (Full Width with Divider)
        // ---------------------------------------------------------

        const billToY = startY + 40;

        // Divider line
        doc.setDrawColor(200, 200, 200);
        doc.line(15, billToY - 5, 195, billToY - 5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text('Bill To:', 15, billToY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const userName = user?.name || payment.name || 'Valued Customer';
        const userEmail = user?.email || payment.email || '';

        doc.text(userName, 15, billToY + 11);
        if (userEmail) doc.text(userEmail, 15, billToY + 16);

        // ---------------------------------------------------------
        // Itemized Table
        // ---------------------------------------------------------

        const tableColumn = ["Description", "Quantity", "Unit Price", "Total"];
        const tableRows = [];

        // Normalize items array
        const items = payment.items || [{
            title: payment.title || 'Service Charge',
            quantity: 1,
            price: payment.amount
        }];

        items.forEach(item => {
            const qty = item.quantity || 1;
            // For books, price passed is now explicitly BOOK_PRICE (ex GST) from CartPage
            // For subscriptions, it's the plan amount (usually inclusive or flat)
            const unitPrice = Number(item.price || 0);
            const lineTotal = unitPrice * qty;

            tableRows.push([
                item.title || 'Item',
                qty,
                `₹${unitPrice.toFixed(2)}`,
                `₹${lineTotal.toFixed(2)}`
            ]);
        });

        // Add table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: billToY + 25,
            theme: 'grid',
            headStyles: {
                fillColor: brandPrimary,
                textColor: 255,
                halign: 'center' // Center align header
            },
            bodyStyles: {
                textColor: 50,
                halign: 'center' // Center align body
            },
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'left' }, // Description left aligned
                1: { cellWidth: 25, halign: 'center' }, // Qty
                2: { cellWidth: 30, halign: 'center' }, // Price
                3: { cellWidth: 30, halign: 'center' }  // Total
            },
            styles: { fontSize: 10, cellPadding: 4 },
        });

        // ---------------------------------------------------------
        // Totals Section
        // ---------------------------------------------------------

        let finalY = doc.lastAutoTable.finalY + 10;

        // Helper for consistent right-aligned totals
        const printTotalLine = (label, value, isBold = false, color = null) => {
            if (isBold) doc.setFont('helvetica', 'bold');
            else doc.setFont('helvetica', 'normal');

            if (color) doc.setTextColor(color);
            else doc.setTextColor(50, 50, 50);

            doc.text(label, 140, finalY);
            doc.text(value, 195, finalY, { align: 'right' });
            finalY += 7;
        };

        // Use passed breakdown if available (for books), otherwise default logic (subscriptions)
        if (payment.subtotal !== undefined) {
            // Book Purchase Breakdown
            printTotalLine('Subtotal:', `₹${Number(payment.subtotal).toFixed(2)}`);

            if (payment.gst > 0) {
                printTotalLine('GST (18%):', `₹${Number(payment.gst).toFixed(2)}`);
            }

            if (payment.platformFee > 0) {
                printTotalLine('Platform Fee:', `₹${Number(payment.platformFee).toFixed(2)}`);
            }

            if (payment.membershipDiscount > 0) {
                printTotalLine('Membership Discount:', `- ₹${Number(payment.membershipDiscount).toFixed(2)}`, false, '#16A34A'); // Green
            }

            if (payment.couponDiscount > 0) {
                printTotalLine('Coupon Savings:', `- ₹${Number(payment.couponDiscount).toFixed(2)}`, false, '#16A34A'); // Green
            }

        } else if (payment.type !== 'subscription') {
            // Fallback for old/simple book payments if breakdown missing
            const totalAmount = Number(payment.amount || 0);
            const subTotal = totalAmount / 1.18;
            const gst = totalAmount - subTotal;
            printTotalLine('Subtotal:', `₹${subTotal.toFixed(2)}`);
            printTotalLine('GST (18%):', `₹${gst.toFixed(2)}`);
        }

        // Grand Total - Strictly what user paid
        doc.setDrawColor(200);
        doc.line(135, finalY - 2, 195, finalY - 2);
        finalY += 3;

        doc.setFontSize(12);
        printTotalLine('Total Amount:', `₹${Number(payment.amount).toFixed(2)}`, true, brandPrimary);

        // ---------------------------------------------------------
        // Footer & Terms
        // ---------------------------------------------------------

        const pageHeight = doc.internal.pageSize.height;

        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('Terms & Conditions:', 15, pageHeight - 35);
        doc.setFontSize(8);
        doc.text('1. This invoice is computer generated and requires no signature.', 15, pageHeight - 30);
        doc.text('2. Payment is due upon receipt.', 15, pageHeight - 26);
        doc.text('3. Please quote invoice number for any queries.', 15, pageHeight - 22);

        // Centered Gratitude
        doc.setFontSize(10);
        doc.setTextColor(brandPrimary);
        doc.setFont('helvetica', 'bold');
        doc.text('Thank you for choosing Bookifyyy!', 105, pageHeight - 15, { align: 'center' });

        doc.save(`Bookifyyy_Invoice_${invoiceId}.pdf`);
        return true;
    } catch (error) {
        console.error("Invoice Generation Failed Detailed Error:", error);
        alert(`Failed to generate invoice. Error: ${error.message}`);
        return false;
    }
};
