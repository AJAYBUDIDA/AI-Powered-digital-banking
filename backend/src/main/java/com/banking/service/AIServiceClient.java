package com.banking.service;

import com.banking.entity.ChatHistory;
import com.banking.entity.User;
import com.banking.repository.ChatHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class AIServiceClient {
    private static final Logger logger = LoggerFactory.getLogger(AIServiceClient.class);

    @Value("${app.aiServiceUrl}")
    private String aiServiceUrl;

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    public static class FraudPredictionResult {
        public BigDecimal riskScore;
        public boolean isSuspicious;

        public FraudPredictionResult(BigDecimal riskScore, boolean isSuspicious) {
            this.riskScore = riskScore;
            this.isSuspicious = isSuspicious;
        }
    }

    /**
     * Checks if a transaction is fraudulent by sending features to the Python ML model.
     * Integrates local fallback rules if Flask is down.
     */
    public FraudPredictionResult analyzeTransaction(BigDecimal amount, Double distance, Integer hour, Integer frequency) {
        String url = aiServiceUrl + "/detect-fraud";
        
        // Prepare request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("amount", amount.doubleValue());
        requestBody.put("distance", distance != null ? distance : 2.5);
        requestBody.put("hour", hour != null ? hour : Calendar.getInstance().get(Calendar.HOUR_OF_DAY));
        requestBody.put("frequency", frequency != null ? frequency : 1);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            
            if (response != null && response.containsKey("risk_score")) {
                double score = ((Number) response.get("risk_score")).doubleValue();
                boolean isSuspicious = (boolean) response.get("is_suspicious");
                return new FraudPredictionResult(BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP), isSuspicious);
            }
        } catch (Exception e) {
            logger.warn("AI Fraud Service down or returned error: {}. Using local rule-based fallback.", e.getMessage());
        }

        // --- LOCAL FALLBACK FRAUD RULES ---
        double riskScore = 0.05; // Base normal risk
        
        double amt = amount.doubleValue();
        double dist = distance != null ? distance : 2.5;
        int hr = hour != null ? hour : Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        int freq = frequency != null ? frequency : 1;

        // Rule 1: High amount AND high distance from billing address
        if (amt > 5000.0 && dist > 200.0) {
            riskScore = 0.92;
        } 
        // Rule 2: Nocturnal hour AND high frequency
        else if ((hr < 5 || hr > 22) && freq > 5) {
            riskScore = 0.81;
        }
        // Rule 3: Single extremely large transaction
        else if (amt > 10000.0) {
            riskScore = 0.75;
        }
        // Rule 4: Moderate suspicious activity
        else if (dist > 500.0 || freq > 8) {
            riskScore = 0.60;
        }

        boolean isSuspicious = riskScore >= 0.70;
        return new FraudPredictionResult(BigDecimal.valueOf(riskScore).setScale(4, RoundingMode.HALF_UP), isSuspicious);
    }

    /**
     * Sends user message and conversation logs to the Flask assistant chatbot.
     * Integrates local fallback rules if Flask is down.
     */
    public String getChatbotResponse(User user, String userMessage) {
        String url = aiServiceUrl + "/chat";

        // Fetch past 5 chat histories for context
        List<ChatHistory> pastHistory = chatHistoryRepository.findByUserIdOrderByTimestampAsc(user.getId());
        List<Map<String, Object>> formattedHistory = new ArrayList<>();
        
        // Slice last 5 elements
        int start = Math.max(0, pastHistory.size() - 5);
        for (int i = start; i < pastHistory.size(); i++) {
            ChatHistory ch = pastHistory.get(i);
            
            // Format for Gemini API turn-by-turn history
            Map<String, Object> userTurn = new HashMap<>();
            userTurn.put("role", "user");
            userTurn.put("parts", List.of(ch.getMessage()));
            
            Map<String, Object> modelTurn = new HashMap<>();
            modelTurn.put("role", "model");
            modelTurn.put("parts", List.of(ch.getResponse()));
            
            formattedHistory.add(userTurn);
            formattedHistory.add(modelTurn);
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("message", userMessage);
        requestBody.put("history", formattedHistory);

        String botReply = null;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            if (response != null && response.containsKey("response")) {
                botReply = (String) response.get("response");
            }
        } catch (Exception e) {
            logger.warn("AI Chatbot Service down: {}. Using local rule-based fallback.", e.getMessage());
        }

        // --- LOCAL FALLBACK CHAT RULES ---
        if (botReply == null) {
            botReply = localChatFallback(userMessage, user.getFirstName());
        }

        // Persist response in history
        ChatHistory chatRecord = ChatHistory.builder()
                .user(user)
                .message(userMessage)
                .response(botReply)
                .build();
        chatHistoryRepository.save(chatRecord);

        return botReply;
    }

    private String localChatFallback(String message, String firstName) {
        String msg = message.toLowerCase();
        
        if (msg.contains("hello") || msg.contains("hi") || msg.contains("hey")) {
            return "Hello " + firstName + "! I'm your local FinoraBank assistant. How can I help you with your bank account, savings, or transfers today?";
        } else if (msg.contains("save") || msg.contains("saving") || msg.contains("budget")) {
            return "Hi " + firstName + ", saving is key! A great guideline is the 50/30/20 budget method. Try allocating 50% of your earnings to essential needs, 30% to wants, and saving the remaining 20% in our High-Yield Savings Account.";
        } else if (msg.contains("rate") || msg.contains("interest") || msg.contains("apy")) {
            return "We offer high-performance accounts: our Savings accounts yield 4.50% APY, checking is 0.05% APY, and our 1-year CD lock yields 5.10% APY.";
        } else if (msg.contains("fraud") || msg.contains("alert") || msg.contains("suspicious")) {
            return "If you spot suspicious activity, freeze your account instantly from the dashboard, or call our 24/7 Fraud Hotline at 1-800-BANK-SAFE.";
        } else if (msg.contains("fee") || msg.contains("charge")) {
            return "We have no monthly maintenance fees on savings or current accounts as long as you maintain a minimum balance of $100.";
        } else if (msg.contains("contact") || msg.contains("phone") || msg.contains("support")) {
            return "We're here to help! Email support@finorabank.com or call our service desk at 1-800-123-4567.";
        }
        
        return "Thank you for asking. I can help with balance reviews, budget guides, transaction lookups, and account security. How would you like to proceed, " + firstName + "?";
    }
}
