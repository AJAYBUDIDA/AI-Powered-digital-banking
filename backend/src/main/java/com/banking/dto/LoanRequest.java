package com.banking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanRequest {

    @NotBlank(message = "Loan type is required")
    private String loanType; // EDUCATION_LOAN, CROP_LOAN, GOLD_LOAN, BUSINESS_LOAN

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "100.00", message = "Minimum loan amount is $100.00")
    private BigDecimal amount;

    @NotBlank(message = "Aadhar number is required")
    private String aadharNumber;

    @NotBlank(message = "Supporting document detail is required")
    private String additionalDocument;
}
