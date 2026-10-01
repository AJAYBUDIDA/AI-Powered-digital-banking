package com.banking.service;

import com.banking.dto.LoanRequest;
import com.banking.dto.LoanResponse;
import com.banking.entity.Account;
import com.banking.entity.Loan;
import com.banking.entity.Transaction;
import com.banking.entity.User;
import com.banking.exception.InvalidTransactionException;
import com.banking.exception.ResourceNotFoundException;
import com.banking.repository.AccountRepository;
import com.banking.repository.LoanRepository;
import com.banking.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional
    public LoanResponse applyForLoan(User user, LoanRequest request) {
        Loan loan = Loan.builder()
                .user(user)
                .loanType(request.getLoanType().toUpperCase())
                .amount(request.getAmount())
                .status("PENDING")
                .aadharNumber(request.getAadharNumber())
                .additionalDocument(request.getAdditionalDocument())
                .build();

        Loan saved = loanRepository.save(loan);

        notificationService.sendNotification(user, 
                "Loan request for $" + request.getAmount() + " (" + request.getLoanType() + ") submitted successfully.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(user, "LOAN_APPLICATION_SUBMITTED", null, 
                "Applied for " + request.getLoanType() + " of $" + request.getAmount());

        return mapToResponse(saved);
    }

    public List<LoanResponse> getLoansByUser(User user) {
        return loanRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LoanResponse> getAllLoans() {
        return loanRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveLoan(Long loanId, User admin) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan application not found: " + loanId));

        if (!"PENDING".equalsIgnoreCase(loan.getStatus())) {
            throw new InvalidTransactionException("Loan application is not pending");
        }

        // Find customer's active account to credit the funds
        List<Account> accounts = accountRepository.findByUser(loan.getUser());
        Account targetAccount = accounts.stream()
                .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                .findFirst()
                .orElseThrow(() -> new InvalidTransactionException("Customer has no active account to disburse the loan"));

        // Approve loan
        loan.setStatus("APPROVED");
        loanRepository.save(loan);

        // Credit target account balance
        targetAccount.setBalance(targetAccount.getBalance().add(loan.getAmount()));
        accountRepository.save(targetAccount);

        // Record a transaction history entry
        String txnNo = "TXN-LOAN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction transaction = Transaction.builder()
                .transactionNumber(txnNo)
                .transactionType("DEPOSIT")
                .amount(loan.getAmount())
                .description("Loan Disbursed: Ref #" + loan.getId() + " (" + loan.getLoanType() + ")")
                .targetAccount(targetAccount)
                .status("COMPLETED")
                .build();
        transactionRepository.save(transaction);

        notificationService.sendNotification(loan.getUser(), 
                "Congratulations! Your loan request for $" + loan.getAmount() + " has been APPROVED. Funds credited to account " + targetAccount.getAccountNumber(), 
                "TRANSACTION");

        auditLogService.log(admin, "LOAN_APPROVED", null, 
                "Approved loan application ID " + loanId + " for User ID " + loan.getUser().getId() + ". Disbursed to account: " + targetAccount.getAccountNumber());
    }

    @Transactional
    public void rejectLoan(Long loanId, User admin) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan application not found: " + loanId));

        if (!"PENDING".equalsIgnoreCase(loan.getStatus())) {
            throw new InvalidTransactionException("Loan application is not pending");
        }

        loan.setStatus("REJECTED");
        loanRepository.save(loan);

        notificationService.sendNotification(loan.getUser(), 
                "Your loan request for $" + loan.getAmount() + " has been rejected.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "LOAN_REJECTED", null, 
                "Rejected loan application ID " + loanId + " for User ID " + loan.getUser().getId());
    }

    private LoanResponse mapToResponse(Loan loan) {
        return LoanResponse.builder()
                .id(loan.getId())
                .loanType(loan.getLoanType())
                .amount(loan.getAmount())
                .status(loan.getStatus())
                .aadharNumber(loan.getAadharNumber())
                .additionalDocument(loan.getAdditionalDocument())
                .createdAt(loan.getCreatedAt())
                .customerName(loan.getUser().getFirstName() + " " + loan.getUser().getLastName())
                .build();
    }
}
