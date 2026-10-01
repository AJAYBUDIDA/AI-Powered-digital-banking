package com.banking.repository;

import com.banking.entity.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findAllByOrderByTimestampDesc();
    List<FraudAlert> findByStatus(String status);
}
