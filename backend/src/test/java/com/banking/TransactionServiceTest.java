package com.banking;

import com.banking.dto.TransactionRequest;
import com.banking.dto.TransactionResponse;
import com.banking.entity.Account;
import com.banking.entity.User;
import com.banking.exception.InsufficientFundsException;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import com.banking.service.AIServiceClient;
import com.banking.service.AuditLogService;
import com.banking.service.NotificationService;
import com.banking.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AIServiceClient aiServiceClient;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private TransactionService transactionService;

    private User user;
    private Account account;

    @BeforeEach
    public void setup() {
        // Set threshold via reflection since value is injected
        ReflectionTestUtils.setField(transactionService, "fraudRiskThreshold", 0.70);

        user = User.builder()
                .id(1L)
                .username("testuser")
                .firstName("John")
                .lastName("Doe")
                .build();

        account = Account.builder()
                .id(10L)
                .accountNumber("1001234567")
                .accountType("SAVINGS")
                .balance(BigDecimal.valueOf(1000.00))
                .status("ACTIVE")
                .user(user)
                .build();
    }

    @Test
    public void testDeposit_Success() {
        TransactionRequest request = new TransactionRequest();
        request.setTransactionType("DEPOSIT");
        request.setAmount(BigDecimal.valueOf(500.00));
        request.setTargetAccountNumber("1001234567");

        when(accountRepository.findByAccountNumber("1001234567")).thenReturn(Optional.of(account));
        when(transactionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.executeTransaction(user, request);

        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals(BigDecimal.valueOf(1500.00), account.getBalance());
        verify(accountRepository, times(1)).save(account);
    }

    @Test
    public void testWithdraw_Success() {
        TransactionRequest request = new TransactionRequest();
        request.setTransactionType("WITHDRAWAL");
        request.setAmount(BigDecimal.valueOf(400.00));
        request.setSourceAccountNumber("1001234567");

        when(accountRepository.findByAccountNumber("1001234567")).thenReturn(Optional.of(account));
        when(aiServiceClient.analyzeTransaction(any(), any(), any(), any()))
                .thenReturn(new AIServiceClient.FraudPredictionResult(BigDecimal.valueOf(0.1), false));
        when(transactionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.executeTransaction(user, request);

        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals(BigDecimal.valueOf(600.00), account.getBalance());
        verify(accountRepository, times(1)).save(account);
    }

    @Test
    public void testWithdraw_InsufficientFunds() {
        TransactionRequest request = new TransactionRequest();
        request.setTransactionType("WITHDRAWAL");
        request.setAmount(BigDecimal.valueOf(1500.00)); // Greater than 1000
        request.setSourceAccountNumber("1001234567");

        when(accountRepository.findByAccountNumber("1001234567")).thenReturn(Optional.of(account));

        assertThrows(InsufficientFundsException.class, () -> {
            transactionService.executeTransaction(user, request);
        });

        verify(accountRepository, never()).save(any());
    }
}
