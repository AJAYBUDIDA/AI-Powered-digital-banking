package com.banking.service;

import com.banking.entity.Notification;
import com.banking.entity.User;
import com.banking.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public void sendNotification(User user, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .status("UNREAD")
                .build();
        notificationRepository.save(notification);
        
        // Industry-Standard expansion: Here we can trigger external email sender, SMS gateways, etc.
        System.out.println("[NOTIFY - EMAIL SIMULATOR] Sending " + type + " to " + user.getEmail() + ": " + message);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndStatusOrderByTimestampDesc(userId, "UNREAD");
    }

    public List<Notification> getAllNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setStatus("READ");
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndStatusOrderByTimestampDesc(userId, "UNREAD");
        unread.forEach(n -> n.setStatus("READ"));
        notificationRepository.saveAll(unread);
    }
}
