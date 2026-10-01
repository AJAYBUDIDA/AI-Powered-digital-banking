package com.banking.service;

import com.banking.dto.AccountRequest;
import com.banking.dto.AccountResponse;
import com.banking.entity.Account;
import com.banking.entity.User;
import com.banking.exception.InvalidTransactionException;
import com.banking.exception.ResourceNotFoundException;
import com.banking.exception.UnauthorizedAccessException;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    private final Random random = new Random();

    @Transactional
    public AccountResponse createAccount(User user, AccountRequest request) {
        String accountNumber = generateUniqueAccountNumber();

        Account account = Account.builder()
                .accountNumber(accountNumber)
                .accountType(request.getAccountType().toUpperCase())
                .balance(request.getInitialDeposit() != null ? request.getInitialDeposit() : BigDecimal.ZERO)
                .status("PENDING") // Must be approved by Admin
                .panNumber(request.getPanNumber())
                .aadharNumber(request.getAadharNumber())
                .user(user)
                .build();

        Account saved = accountRepository.save(account);

        // Notify user and audit
        notificationService.sendNotification(user, 
                "Account creation request submitted. Account Number: " + accountNumber + " is pending approval.", 
                "ACCOUNT_ACTIVITY");
        
        auditLogService.log(user, "ACCOUNT_CREATION_REQUESTED", null, 
                "Created account " + accountNumber + " type " + request.getAccountType() + " in PENDING status");

        return mapToResponse(saved);
    }

    public List<AccountResponse> getAccountsByUser(User user) {
        return accountRepository.findByUser(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AccountResponse getAccountDetails(String accountNumber, User currentUser) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));

        // Check ownership (unless current user is Admin)
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
        if (!account.getUser().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new UnauthorizedAccessException("You do not have permission to view this account");
        }

        return mapToResponse(account);
    }

    public List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveAccount(Long accountId, User admin) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!"PENDING".equals(account.getStatus())) {
            throw new InvalidTransactionException("Account is not in PENDING status");
        }

        account.setStatus("ACTIVE");
        accountRepository.save(account);

        notificationService.sendNotification(account.getUser(), 
                "Congratulations! Your account " + account.getAccountNumber() + " has been approved and is active.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "ACCOUNT_APPROVED", null, 
                "Approved account ID: " + accountId + " (Number: " + account.getAccountNumber() + ") owned by User ID: " + account.getUser().getId());
    }

    @Transactional
    public void rejectAccount(Long accountId, User admin) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!"PENDING".equals(account.getStatus())) {
            throw new InvalidTransactionException("Account is not in PENDING status");
        }

        account.setStatus("REJECTED");
        accountRepository.save(account);

        notificationService.sendNotification(account.getUser(), 
                "Your request to open account ID: " + accountId + " has been rejected by administration.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "ACCOUNT_REJECTED", null, 
                "Rejected account ID: " + accountId + " owned by User ID: " + account.getUser().getId());
    }

    @Transactional
    public void freezeAccount(String accountNumber, User admin) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));

        account.setStatus("FROZEN");
        accountRepository.save(account);

        notificationService.sendNotification(account.getUser(), 
                "Your account " + accountNumber + " has been temporarily frozen. Outgoing transfers are restricted.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "ACCOUNT_FROZEN", null, "Froze account: " + accountNumber);
    }

    @Transactional
    public void unfreezeAccount(String accountNumber, User admin) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountNumber));

        account.setStatus("ACTIVE");
        accountRepository.save(account);

        notificationService.sendNotification(account.getUser(), 
                "Your account " + accountNumber + " has been unfrozen. Full access restored.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "ACCOUNT_UNFROZEN", null, "Unfroze account: " + accountNumber);
    }

    @Transactional
    public void freezeCustomer(Long customerId, User admin) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        customer.setStatus("FROZEN");
        userRepository.save(customer);

        auditLogService.log(admin, "CUSTOMER_FROZEN", null, 
                "Froze customer profile: ID " + customerId + " (" + customer.getUsername() + ")");
    }

    @Transactional
    public void unfreezeCustomer(Long customerId, User admin) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        customer.setStatus("ACTIVE");
        userRepository.save(customer);

        auditLogService.log(admin, "CUSTOMER_UNFROZEN", null, 
                "Unfroze customer profile: ID " + customerId + " (" + customer.getUsername() + ")");
    }

    private String generateUniqueAccountNumber() {
        String number;
        do {
            long rawNumber = 1000000000L + random.nextLong(9000000000L); // 10 digit number starting with 1
            number = String.valueOf(rawNumber);
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }

    public AccountResponse mapToResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType())
                .balance(account.getBalance())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .ownerName(account.getUser().getFirstName() + " " + account.getUser().getLastName())
                .panNumber(account.getPanNumber())
                .aadharNumber(account.getAadharNumber())
                .build();
    }
}
