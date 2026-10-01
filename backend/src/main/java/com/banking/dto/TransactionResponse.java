package com.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private String transactionNumber;
    private String transactionType;
    private BigDecimal amount;
    private String description;
    private LocalDateTime timestamp;
    private String status;
    private String sourceAccountNumber;
    private String targetAccountNumber;
}
