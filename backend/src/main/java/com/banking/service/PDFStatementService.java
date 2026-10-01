package com.banking.service;

import com.banking.entity.Account;
import com.banking.entity.Transaction;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PDFStatementService {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] generateStatementPdf(Account account, List<Transaction> transactions) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font bankNameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new Color(0, 102, 204));
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font redFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(204, 0, 0));
            Font greenFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(0, 153, 76));

            // Header Section (Bank Name)
            Paragraph bankName = new Paragraph("FINORABANK", bankNameFont);
            bankName.setAlignment(Element.ALIGN_CENTER);
            bankName.setSpacingAfter(20);
            document.add(bankName);

            // Document Title
            Paragraph docTitle = new Paragraph("OFFICIAL ACCOUNT STATEMENT", titleFont);
            docTitle.setAlignment(Element.ALIGN_CENTER);
            docTitle.setSpacingAfter(25);
            document.add(docTitle);

            // Customer and Account Info Table (Side by Side layout)
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setSpacingAfter(20);

            // Left Side: Customer Info
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.addElement(new Paragraph("CUSTOMER DETAILS", boldFont));
            leftCell.addElement(new Paragraph("Name: " + account.getUser().getFirstName() + " " + account.getUser().getLastName(), regularFont));
            leftCell.addElement(new Paragraph("Email: " + account.getUser().getEmail(), regularFont));
            leftCell.addElement(new Paragraph("Phone: " + (account.getUser().getPhoneNumber() != null ? account.getUser().getPhoneNumber() : "N/A"), regularFont));
            infoTable.addCell(leftCell);

            // Right Side: Account Info
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.addElement(new Paragraph("ACCOUNT SUMMARY", boldFont));
            rightCell.addElement(new Paragraph("Account Number: " + account.getAccountNumber(), regularFont));
            rightCell.addElement(new Paragraph("Account Type: " + account.getAccountType(), regularFont));
            rightCell.addElement(new Paragraph("Current Balance: $" + account.getBalance().toString(), boldFont));
            rightCell.addElement(new Paragraph("Status: " + account.getStatus(), regularFont));
            infoTable.addCell(rightCell);

            document.add(infoTable);

            // Summary Stats (Total Deposits vs Withdrawals)
            BigDecimal totalDeposits = BigDecimal.ZERO;
            BigDecimal totalWithdrawals = BigDecimal.ZERO;
            for (Transaction tx : transactions) {
                if ("DEPOSIT".equalsIgnoreCase(tx.getTransactionType())) {
                    totalDeposits = totalDeposits.add(tx.getAmount());
                } else if ("WITHDRAWAL".equalsIgnoreCase(tx.getTransactionType())) {
                    totalWithdrawals = totalWithdrawals.add(tx.getAmount());
                } else if ("TRANSFER".equalsIgnoreCase(tx.getTransactionType())) {
                    // Check if current account is source or target
                    if (account.getId().equals(tx.getSourceAccount().getId())) {
                        totalWithdrawals = totalWithdrawals.add(tx.getAmount());
                    } else if (account.getId().equals(tx.getTargetAccount().getId())) {
                        totalDeposits = totalDeposits.add(tx.getAmount());
                    }
                }
            }

            Paragraph stats = new Paragraph("Statement Summary (This period): Total Deposits: $" + totalDeposits + " | Total Withdrawals: $" + totalWithdrawals, boldFont);
            stats.setSpacingAfter(15);
            document.add(stats);

            // Transaction Ledger Table
            PdfPTable ledgerTable = new PdfPTable(6);
            ledgerTable.setWidthPercentage(100);
            ledgerTable.setWidths(new float[]{1.8f, 1.2f, 1.2f, 2.3f, 1.0f, 1.0f});

            // Headers
            String[] headers = {"Date & Time", "Tx Number", "Type", "Description", "Amount", "Status"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(new Color(0, 102, 204));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                ledgerTable.addCell(cell);
            }

            // Data Rows
            for (Transaction tx : transactions) {
                // Time
                PdfPCell cellTime = new PdfPCell(new Phrase(tx.getTimestamp().format(formatter), regularFont));
                cellTime.setPadding(5);
                ledgerTable.addCell(cellTime);

                // Number
                PdfPCell cellNo = new PdfPCell(new Phrase(tx.getTransactionNumber().substring(0, Math.min(12, tx.getTransactionNumber().length())), regularFont));
                cellNo.setPadding(5);
                ledgerTable.addCell(cellNo);

                // Type
                PdfPCell cellType = new PdfPCell(new Phrase(tx.getTransactionType(), regularFont));
                cellType.setPadding(5);
                cellType.setHorizontalAlignment(Element.ALIGN_CENTER);
                ledgerTable.addCell(cellType);

                // Description
                PdfPCell cellDesc = new PdfPCell(new Phrase(tx.getDescription() != null ? tx.getDescription() : "", regularFont));
                cellDesc.setPadding(5);
                ledgerTable.addCell(cellDesc);

                // Amount
                String prefix = "";
                Font amountFont = regularFont;
                if ("DEPOSIT".equalsIgnoreCase(tx.getTransactionType()) || 
                    ("TRANSFER".equalsIgnoreCase(tx.getTransactionType()) && account.getId().equals(tx.getTargetAccount().getId()))) {
                    prefix = "+$";
                    amountFont = greenFont;
                } else {
                    prefix = "-$";
                    amountFont = redFont;
                }
                PdfPCell cellAmt = new PdfPCell(new Phrase(prefix + tx.getAmount().toString(), amountFont));
                cellAmt.setPadding(5);
                cellAmt.setHorizontalAlignment(Element.ALIGN_RIGHT);
                ledgerTable.addCell(cellAmt);

                // Status
                PdfPCell cellStatus = new PdfPCell(new Phrase(tx.getStatus(), regularFont));
                cellStatus.setPadding(5);
                cellStatus.setHorizontalAlignment(Element.ALIGN_CENTER);
                ledgerTable.addCell(cellStatus);
            }

            document.add(ledgerTable);

            // Footer / Disclaimer
            Paragraph footer = new Paragraph("\n\nThank you for banking with FinoraBank. For inquiries, email support@finorabank.com. This is a computer generated document and does not require a physical signature.", FontFactory.getFont(FontFactory.HELVETICA, 8, Font.ITALIC, Color.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } catch (DocumentException e) {
            e.printStackTrace();
        } finally {
            document.close();
        }

        return out.toByteArray();
    }
}
