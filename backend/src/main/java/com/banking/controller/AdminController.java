package com.banking.controller;

import com.banking.dto.*;
import com.banking.entity.AuditLog;
import com.banking.entity.FraudAlert;
import com.banking.entity.User;
import com.banking.entity.Account;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import com.banking.security.UserDetailsImpl;
import com.banking.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private LoanService loanService;

    @Autowired
    private CardService cardService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    private User getAuthenticatedAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated administrator not found"));
    }

    // --- Customer Management ---
    @GetMapping("/customers")
    public ResponseEntity<List<UserResponse>> getAllCustomers() {
        List<UserResponse> customers = userRepository.findAllCustomers().stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .phoneNumber(user.getPhoneNumber())
                        .status(user.getStatus())
                        .roles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList()))
                        .accounts(accountService.getAccountsByUser(user))
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(customers);
    }

    @PutMapping("/customers/{id}/freeze")
    public ResponseEntity<Void> freezeCustomer(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        accountService.freezeCustomer(id, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/customers/{id}/unfreeze")
    public ResponseEntity<Void> unfreezeCustomer(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        accountService.unfreezeCustomer(id, admin);
        return ResponseEntity.ok().build();
    }

    // --- Account Management ---
    @GetMapping("/accounts")
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        List<AccountResponse> accounts = accountService.getAllAccounts();
        return ResponseEntity.ok(accounts);
    }

    @PutMapping("/accounts/{id}/approve")
    public ResponseEntity<Void> approveAccount(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        accountService.approveAccount(id, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/accounts/{id}/reject")
    public ResponseEntity<Void> rejectAccount(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        accountService.rejectAccount(id, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/accounts/{accountNumber}/freeze")
    public ResponseEntity<Void> freezeAccount(@PathVariable String accountNumber) {
        User admin = getAuthenticatedAdmin();
        accountService.freezeAccount(accountNumber, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/accounts/{accountNumber}/unfreeze")
    public ResponseEntity<Void> unfreezeAccount(@PathVariable String accountNumber) {
        User admin = getAuthenticatedAdmin();
        accountService.unfreezeAccount(accountNumber, admin);
        return ResponseEntity.ok().build();
    }

    // --- Transaction Monitoring ---
    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {
        List<TransactionResponse> transactions = transactionService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }

    // --- Fraud Alert Management ---
    @GetMapping("/fraud-alerts")
    public ResponseEntity<List<FraudAlertResponse>> getAllFraudAlerts() {
        List<FraudAlertResponse> alerts = transactionService.getAllFraudAlerts().stream()
                .map(alert -> FraudAlertResponse.builder()
                        .id(alert.getId())
                        .transactionNumber(alert.getTransaction().getTransactionNumber())
                        .amount(alert.getTransaction().getAmount())
                        .customerName(alert.getTransaction().getSourceAccount().getUser().getFirstName() + " " +
                                      alert.getTransaction().getSourceAccount().getUser().getLastName())
                        .riskScore(alert.getRiskScore())
                        .alertReason(alert.getAlertReason())
                        .status(alert.getStatus())
                        .timestamp(alert.getTimestamp())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    @PutMapping("/fraud-alerts/{id}/resolve")
    public ResponseEntity<Void> resolveFraudAlert(@PathVariable Long id, @RequestParam String status) {
        User admin = getAuthenticatedAdmin();
        transactionService.resolveFraudAlert(id, status, admin);
        return ResponseEntity.ok().build();
    }

    // --- Audit Log Access ---
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        List<AuditLog> logs = auditLogService.getAllLogs();
        return ResponseEntity.ok(logs);
    }

    // --- Analytics Dashboard ---
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getBankingAnalytics() {
        List<Account> accounts = accountRepository.findAll();
        List<FraudAlert> alerts = transactionService.getAllFraudAlerts();
        List<User> customers = userRepository.findAllCustomers();

        BigDecimal totalDeposits = accounts.stream()
                .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingApprovals = accounts.stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count();
        long frozenAccounts = accounts.stream().filter(a -> "FROZEN".equalsIgnoreCase(a.getStatus())).count();
        long activeFraudAlerts = alerts.stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count();

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalDeposits", totalDeposits);
        analytics.put("totalCustomers", customers.size());
        analytics.put("totalAccounts", accounts.size());
        analytics.put("pendingApprovals", pendingApprovals);
        analytics.put("frozenAccounts", frozenAccounts);
        analytics.put("activeFraudAlerts", activeFraudAlerts);

        return ResponseEntity.ok(analytics);
    }

    // --- Loan Management ---
    @GetMapping("/loans")
    public ResponseEntity<List<LoanResponse>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    @PutMapping("/loans/{id}/approve")
    public ResponseEntity<Void> approveLoan(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        loanService.approveLoan(id, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/loans/{id}/reject")
    public ResponseEntity<Void> rejectLoan(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        loanService.rejectLoan(id, admin);
        return ResponseEntity.ok().build();
    }

    // --- Card Management ---
    @GetMapping("/cards")
    public ResponseEntity<List<CardResponse>> getAllCards() {
        return ResponseEntity.ok(cardService.getAllCards());
    }

    @PutMapping("/cards/{id}/approve")
    public ResponseEntity<Void> approveCard(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        cardService.approveCard(id, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/cards/{id}/reject")
    public ResponseEntity<Void> rejectCard(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        cardService.rejectCard(id, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/cards/{id}/toggle-lock")
    public ResponseEntity<Void> toggleCardBlock(@PathVariable Long id) {
        User admin = getAuthenticatedAdmin();
        cardService.toggleCardBlock(id, admin);
        return ResponseEntity.ok().build();
    }
}

