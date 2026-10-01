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
public class FraudAlertResponse {
    private Long id;
    private String transactionNumber;
    private BigDecimal amount;
    private String customerName;
    private BigDecimal riskScore;
    private String alertReason;
    private String status;
    private LocalDateTime timestamp;
}
