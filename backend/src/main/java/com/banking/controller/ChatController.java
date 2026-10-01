package com.banking.controller;

import com.banking.dto.ChatRequest;
import com.banking.dto.ChatResponse;
import com.banking.entity.User;
import com.banking.repository.UserRepository;
import com.banking.security.UserDetailsImpl;
import com.banking.service.AIServiceClient;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/customer/chat")
public class ChatController {

    @Autowired
    private AIServiceClient aiServiceClient;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ChatResponse> chatWithAssistant(@Valid @RequestBody ChatRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        String aiResponse = aiServiceClient.getChatbotResponse(user, request.getMessage());

        ChatResponse response = ChatResponse.builder()
                .response(aiResponse)
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(response);
    }
}
