package com.banking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransactionRequest {

    @NotBlank(message = "Transaction type is required (DEPOSIT/WITHDRAWAL/TRANSFER)")
    private String transactionType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String description;

    private String sourceAccountNumber;

    private String targetAccountNumber;

    // Simulation Parameters for AI Fraud Model (Optional)
    private Double distance = 2.5; // distance from home (in km)
    
    private Integer hour; // hour of transaction (0-23)
    
    private Integer frequency = 1; // number of transactions in last 24h
}
