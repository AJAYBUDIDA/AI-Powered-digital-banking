package com.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountRequest {

    @NotBlank(message = "Account type is required (SAVINGS/CURRENT)")
    private String accountType;

    private BigDecimal initialDeposit;

    private String panNumber;
    
    private String aadharNumber;
}
