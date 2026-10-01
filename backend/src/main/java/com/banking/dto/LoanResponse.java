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
public class LoanResponse {
    private Long id;
    private String loanType;
    private BigDecimal amount;
    private String status;
    private String aadharNumber;
    private String additionalDocument;
    private LocalDateTime createdAt;
    private String customerName;
}
