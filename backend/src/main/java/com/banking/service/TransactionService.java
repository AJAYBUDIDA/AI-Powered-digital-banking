package com.banking.service;

import com.banking.dto.TransactionRequest;
import com.banking.dto.TransactionResponse;
import com.banking.entity.Account;
import com.banking.entity.FraudAlert;
import com.banking.entity.Transaction;
import com.banking.entity.User;
import com.banking.exception.InsufficientFundsException;
import com.banking.exception.InvalidTransactionException;
import com.banking.exception.ResourceNotFoundException;
import com.banking.exception.UnauthorizedAccessException;
import com.banking.repository.AccountRepository;
import com.banking.repository.FraudAlertRepository;
import com.banking.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private FraudAlertRepository fraudAlertRepository;

    @Autowired
    private AIServiceClient aiServiceClient;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    @Value("${app.fraudRiskThreshold}")
    private double fraudRiskThreshold;

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionResponse executeTransaction(User user, TransactionRequest request) {
        String txNumber = "TXN-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase();
        String type = request.getTransactionType().toUpperCase();
        BigDecimal amount = request.getAmount();

        Account source = null;
        Account target = null;

        // 1. Fetch and Validate Accounts
        if ("WITHDRAWAL".equals(type) || "TRANSFER".equals(type)) {
            source = accountRepository.findByAccountNumber(request.getSourceAccountNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Source account not found: " + request.getSourceAccountNumber()));
            
            // Check ownership
            if (!source.getUser().getId().equals(user.getId())) {
                throw new UnauthorizedAccessException("You do not own the source account (Account owner ID: " + 
                        source.getUser().getId() + ", Your ID: " + user.getId() + ")");
            }
            // Check active status
            if (!"ACTIVE".equals(source.getStatus())) {
                throw new InvalidTransactionException("Source account is not active. Status: " + source.getStatus());
            }
            // Check funds
            if (source.getBalance().compareTo(amount) < 0) {
                throw new InsufficientFundsException("Insufficient funds in source account");
            }
        }

        if ("DEPOSIT".equals(type) || "TRANSFER".equals(type)) {
            target = accountRepository.findByAccountNumber(request.getTargetAccountNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Target account not found: " + request.getTargetAccountNumber()));
            
            // Check active status
            if (!"ACTIVE".equals(target.getStatus())) {
                throw new InvalidTransactionException("Target account is not active. Status: " + target.getStatus());
            }
        }

        // 2. Perform AI Fraud Detection (For withdrawals and transfers)
        boolean isSuspicious = false;
        BigDecimal riskScore = BigDecimal.ZERO;
        
        if ("WITHDRAWAL".equals(type) || "TRANSFER".equals(type)) {
            AIServiceClient.FraudPredictionResult fraudResult = aiServiceClient.analyzeTransaction(
                    amount, request.getDistance(), request.getHour(), request.getFrequency());
            riskScore = fraudResult.riskScore;
            isSuspicious = fraudResult.isSuspicious;
        }

        // 3. Create Transaction Record
        Transaction transaction = Transaction.builder()
                .transactionNumber(txNumber)
                .transactionType(type)
                .amount(amount)
                .description(request.getDescription())
                .sourceAccount(source)
                .targetAccount(target)
                .status(isSuspicious ? "SUSPICIOUS" : "COMPLETED")
                .build();

        Transaction savedTx = transactionRepository.save(transaction);

        // 4. Handle Suspicious Block
        if (isSuspicious) {
            // Log Alert in database
            String reason = "AI Risk Score: " + riskScore + ". Distance: " + request.getDistance() + "km.";
            FraudAlert alert = FraudAlert.builder()
                    .transaction(savedTx)
                    .riskScore(riskScore)
                    .alertReason(reason)
                    .status("PENDING")
                    .build();
            fraudAlertRepository.save(alert);

            // Notify Customer & System Admin
            notificationService.sendNotification(user, 
                    "Warning: A transaction of $" + amount + " on account " + 
                    (source != null ? source.getAccountNumber() : "unknown") + 
                    " was flagged as suspicious by AI and blocked.", "FRAUD");
            
            // Audit Log
            auditLogService.log(user, "FRAUD_ALERT_GENERATED", null, 
                    "Transaction " + txNumber + " flagged as high fraud risk (Score: " + riskScore + "). Balances untouched.");

            throw new InvalidTransactionException("Transaction blocked: Suspicious transaction pattern detected. Ref: " + txNumber);
        }

        // 5. Update Account Balances (For Safe Transactions)
        if ("DEPOSIT".equals(type)) {
            target.setBalance(target.getBalance().add(amount));
            accountRepository.save(target);
            notificationService.sendNotification(target.getUser(), 
                    "Deposit of $" + amount + " successfully credited to your account " + target.getAccountNumber(), 
                    "TRANSACTION");
        } 
        else if ("WITHDRAWAL".equals(type)) {
            source.setBalance(source.getBalance().subtract(amount));
            accountRepository.save(source);
            notificationService.sendNotification(source.getUser(), 
                    "Withdrawal of $" + amount + " successfully completed from account " + source.getAccountNumber(), 
                    "TRANSACTION");
        } 
        else if ("TRANSFER".equals(type)) {
            source.setBalance(source.getBalance().subtract(amount));
            target.setBalance(target.getBalance().add(amount));
            accountRepository.save(source);
            accountRepository.save(target);
            
            notificationService.sendNotification(source.getUser(), 
                    "Transferred $" + amount + " to account " + target.getAccountNumber(), 
                    "TRANSACTION");
            
            notificationService.sendNotification(target.getUser(), 
                    "Received $" + amount + " from account " + source.getAccountNumber(), 
                    "TRANSACTION");
        }

        auditLogService.log(user, "TRANSACTION_COMPLETED", null, 
                "Completed " + type + " of $" + amount + " (" + txNumber + ")");

        return mapToResponse(savedTx);
    }

    public List<TransactionResponse> getTransactionsByAccount(String accountNumber, User currentUser) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));

        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
        if (!account.getUser().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new UnauthorizedAccessException("You do not have access to this account's ledger");
        }

        return transactionRepository.findAllByAccountIdOrderByTimestampDesc(account.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getTransactionsByUser(User currentUser) {
        return transactionRepository.findAllByUserIdOrderByTimestampDesc(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAllOrderByTimestampDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- FRAUD ALERTS ADMINISTRATIVE METHODS ---
    public List<FraudAlert> getAllFraudAlerts() {
        return fraudAlertRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public void resolveFraudAlert(Long alertId, String resolutionStatus, User admin) {
        FraudAlert alert = fraudAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Fraud alert not found with ID: " + alertId));

        alert.setStatus(resolutionStatus); // e.g., RESOLVED, INVESTIGATED
        fraudAlertRepository.save(alert);

        auditLogService.log(admin, "FRAUD_ALERT_RESOLVED", null, 
                "Resolved fraud alert ID: " + alertId + " as " + resolutionStatus);
    }

    public TransactionResponse mapToResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .transactionNumber(tx.getTransactionNumber())
                .transactionType(tx.getTransactionType())
                .amount(tx.getAmount())
                .description(tx.getDescription())
                .timestamp(tx.getTimestamp())
                .status(tx.getStatus())
                .sourceAccountNumber(tx.getSourceAccount() != null ? tx.getSourceAccount().getAccountNumber() : null)
                .targetAccountNumber(tx.getTargetAccount() != null ? tx.getTargetAccount().getAccountNumber() : null)
                .build();
    }
}
