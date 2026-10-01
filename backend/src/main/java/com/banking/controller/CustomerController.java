package com.banking.controller;

import com.banking.dto.*;
import com.banking.entity.Account;
import com.banking.entity.Notification;
import com.banking.entity.User;
import com.banking.entity.Transaction;
import com.banking.exception.ResourceNotFoundException;
import com.banking.exception.UnauthorizedAccessException;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import com.banking.repository.UserRepository;
import com.banking.security.UserDetailsImpl;
import com.banking.service.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private LoanService loanService;

    @Autowired
    private CardService cardService;

    @Autowired
    private PDFStatementService pdfStatementService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    // --- Account Endpoints ---
    @PostMapping("/accounts")
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody AccountRequest request) {
        User user = getAuthenticatedUser();
        AccountResponse response = accountService.createAccount(user, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<AccountResponse>> getMyAccounts() {
        User user = getAuthenticatedUser();
        List<AccountResponse> response = accountService.getAccountsByUser(user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/accounts/{accountNumber}")
    public ResponseEntity<AccountResponse> getAccountDetails(@PathVariable String accountNumber) {
        User user = getAuthenticatedUser();
        AccountResponse response = accountService.getAccountDetails(accountNumber, user);
        return ResponseEntity.ok(response);
    }

    // --- Transaction Endpoints ---
    @PostMapping("/transactions")
    public ResponseEntity<TransactionResponse> executeTransaction(@Valid @RequestBody TransactionRequest request) {
        User user = getAuthenticatedUser();
        TransactionResponse response = transactionService.executeTransaction(user, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionResponse>> getMyTransactions() {
        User user = getAuthenticatedUser();
        List<TransactionResponse> response = transactionService.getTransactionsByUser(user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions/{accountNumber}")
    public ResponseEntity<List<TransactionResponse>> getAccountTransactions(@PathVariable String accountNumber) {
        User user = getAuthenticatedUser();
        List<TransactionResponse> response = transactionService.getTransactionsByAccount(accountNumber, user);
        return ResponseEntity.ok(response);
    }

    // --- PDF Statement Endpoint ---
    @GetMapping("/accounts/{accountNumber}/statement")
    public ResponseEntity<byte[]> downloadStatement(@PathVariable String accountNumber) {
        User user = getAuthenticatedUser();
        
        // Fetch account
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));

        // Check ownership
        if (!account.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You do not own this account (Account owner ID: " + 
                    account.getUser().getId() + ", Your ID: " + user.getId() + ")");
        }

        // Fetch transaction records
        List<Transaction> transactions = transactionRepository.findAllByAccountIdOrderByTimestampDesc(account.getId());

        // Generate PDF
        byte[] pdfBytes = pdfStatementService.generateStatementPdf(account, transactions);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "statement_" + accountNumber + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    // --- Notification Endpoints ---
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = getAuthenticatedUser();
        List<Notification> response = notificationService.getAllNotifications(user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/notifications/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        User user = getAuthenticatedUser();
        List<Notification> response = notificationService.getUnreadNotifications(user.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllNotificationsAsRead() {
        User user = getAuthenticatedUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }

    // --- Loan Endpoints ---
    @GetMapping("/loans")
    public ResponseEntity<List<LoanResponse>> getMyLoans() {
        User user = getAuthenticatedUser();
        List<LoanResponse> response = loanService.getLoansByUser(user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/loans")
    public ResponseEntity<LoanResponse> applyForLoan(@Valid @RequestBody LoanRequest request) {
        User user = getAuthenticatedUser();
        LoanResponse response = loanService.applyForLoan(user, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // --- Card Endpoints ---
    @GetMapping("/cards")
    public ResponseEntity<List<CardResponse>> getMyCards() {
        User user = getAuthenticatedUser();
        List<CardResponse> response = cardService.getCardsByUser(user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cards")
    public ResponseEntity<CardResponse> applyForCard(@Valid @RequestBody CardRequest request) {
        User user = getAuthenticatedUser();
        CardResponse response = cardService.applyForCard(user, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
