package com.banking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 50)
    private String type; // TRANSACTION, FRAUD, ACCOUNT_ACTIVITY

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "UNREAD"; // UNREAD, READ

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
