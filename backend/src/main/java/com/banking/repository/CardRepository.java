package com.banking.repository;

import com.banking.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

    @Query("SELECT c FROM Card c WHERE c.account.user.id = :userId ORDER BY c.createdAt DESC")
    List<Card> findAllByUserId(@Param("userId") Long userId);

    List<Card> findAllByOrderByCreatedAtDesc();
}
