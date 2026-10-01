package com.banking.service;

import com.banking.dto.CardRequest;
import com.banking.dto.CardResponse;
import com.banking.entity.Account;
import com.banking.entity.Card;
import com.banking.entity.User;
import com.banking.exception.InvalidTransactionException;
import com.banking.exception.ResourceNotFoundException;
import com.banking.exception.UnauthorizedAccessException;
import com.banking.repository.AccountRepository;
import com.banking.repository.CardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class CardService {

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    private final Random random = new Random();

    @Transactional
    public CardResponse applyForCard(User user, CardRequest request) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + request.getAccountNumber()));

        // Validate Ownership
        if (!account.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You do not own this account (Account owner ID: " + 
                    account.getUser().getId() + ", Your ID: " + user.getId() + ")");
        }
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new InvalidTransactionException("Linked account is not active");
        }

        // Generate 16 digit card number: Format "xxxx-xxxx-xxxx-xxxx"
        String cardNumber = generateCardNumber(request.getCardType());

        Card card = Card.builder()
                .account(account)
                .cardNumber(cardNumber)
                .cardType(request.getCardType().toUpperCase())
                .status("PENDING")
                .build();

        Card saved = cardRepository.save(card);

        notificationService.sendNotification(user, 
                "Requested a new " + request.getCardType() + " card for account " + request.getAccountNumber() + ". Awaiting approval.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(user, "CARD_APPLICATION_SUBMITTED", null, 
                "Requested " + request.getCardType() + " card linked to account " + request.getAccountNumber());

        return mapToResponse(saved);
    }

    public List<CardResponse> getCardsByUser(User user) {
        return cardRepository.findAllByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CardResponse> getAllCards() {
        return cardRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveCard(Long cardId, User admin) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card application not found: " + cardId));

        if (!"PENDING".equalsIgnoreCase(card.getStatus())) {
            throw new InvalidTransactionException("Card is not pending approval");
        }

        card.setStatus("ACTIVE");
        cardRepository.save(card);

        notificationService.sendNotification(card.getAccount().getUser(), 
                "Congratulations! Your " + card.getCardType() + " card (" + card.getCardNumber() + ") has been approved and activated.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "CARD_APPROVED", null, 
                "Approved card ID " + cardId + " linked to account " + card.getAccount().getAccountNumber());
    }

    @Transactional
    public void rejectCard(Long cardId, User admin) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card application not found: " + cardId));

        if (!"PENDING".equalsIgnoreCase(card.getStatus())) {
            throw new InvalidTransactionException("Card is not pending approval");
        }

        card.setStatus("REJECTED");
        cardRepository.save(card);

        notificationService.sendNotification(card.getAccount().getUser(), 
                "Your application for a " + card.getCardType() + " card has been rejected.", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "CARD_REJECTED", null, 
                "Rejected card ID " + cardId + " linked to account " + card.getAccount().getAccountNumber());
    }

    @Transactional
    public void toggleCardBlock(Long cardId, User admin) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found: " + cardId));

        if ("PENDING".equalsIgnoreCase(card.getStatus()) || "REJECTED".equalsIgnoreCase(card.getStatus())) {
            throw new InvalidTransactionException("Cannot lock/unlock an unapproved card");
        }

        String oldStatus = card.getStatus();
        String newStatus = "ACTIVE".equalsIgnoreCase(oldStatus) ? "BLOCKED" : "ACTIVE";
        card.setStatus(newStatus);
        cardRepository.save(card);

        notificationService.sendNotification(card.getAccount().getUser(), 
                "Your " + card.getCardType() + " card (" + card.getCardNumber() + ") is now " + newStatus.toLowerCase() + ".", 
                "ACCOUNT_ACTIVITY");

        auditLogService.log(admin, "CARD_STATUS_TOGGLED", null, 
                "Toggled card ID " + cardId + " from " + oldStatus + " to " + newStatus);
    }

    private String generateCardNumber(String type) {
        // Mastercard prefix 54, Visa prefix 45
        String prefix = "DEBIT".equalsIgnoreCase(type) ? "4568-" : "5412-";
        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < 3; i++) {
            int block = 1000 + random.nextInt(9000);
            sb.append(block);
            if (i < 2) sb.append("-");
        }
        return sb.toString();
    }

    private CardResponse mapToResponse(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .cardNumber(card.getCardNumber())
                .cardType(card.getCardType())
                .status(card.getStatus())
                .accountNumber(card.getAccount().getAccountNumber())
                .createdAt(card.getCreatedAt())
                .ownerName(card.getAccount().getUser().getFirstName() + " " + card.getAccount().getUser().getLastName())
                .build();
    }
}
