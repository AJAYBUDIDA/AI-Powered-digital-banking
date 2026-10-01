package com.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CardRequest {

    @NotBlank(message = "Account number is required to link the card")
    private String accountNumber;

    @NotBlank(message = "Card type is required (DEBIT/CREDIT)")
    private String cardType;
}
