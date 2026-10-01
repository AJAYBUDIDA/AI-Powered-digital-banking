package com.banking;

import com.banking.entity.Account;
import com.banking.entity.Role;
import com.banking.entity.User;
import com.banking.repository.AccountRepository;
import com.banking.repository.RoleRepository;
import com.banking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class DigitalBankingApplication {

    public static void main(String[] args) {
        SpringApplication.run(DigitalBankingApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, 
                                         RoleRepository roleRepository, 
                                         AccountRepository accountRepository, 
                                         PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Initialize Roles
            Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                    .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_CUSTOMER").build()));
            
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").build()));

            // 2. Initialize Default Admin User
            if (!userRepository.existsByUsername("admin")) {
                Set<Role> adminRoles = new HashSet<>();
                adminRoles.add(adminRole);
                
                User admin = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .email("admin@finorabank.com")
                        .firstName("System")
                        .lastName("Administrator")
                        .phoneNumber("1-800-ADMIN")
                        .status("ACTIVE")
                        .roles(adminRoles)
                        .build();
                userRepository.save(admin);
                System.out.println("[DB SEEDER] Created Default Admin: admin / admin123");
            }

            // 3. Initialize Default Customer User
            if (!userRepository.existsByUsername("customer")) {
                Set<Role> customerRoles = new HashSet<>();
                customerRoles.add(customerRole);
                
                User customer = User.builder()
                        .username("customer")
                        .password(passwordEncoder.encode("customer123"))
                        .email("customer@gmail.com")
                        .firstName("John")
                        .lastName("Doe")
                        .phoneNumber("+1-555-0199")
                        .status("ACTIVE")
                        .roles(customerRoles)
                        .build();
                User savedCustomer = userRepository.save(customer);
                System.out.println("[DB SEEDER] Created Default Customer: customer / customer123");

                // Initialize a default active account for the customer
                Account customerAccount = Account.builder()
                        .accountNumber("1009876543")
                        .accountType("SAVINGS")
                        .balance(BigDecimal.valueOf(5000.00))
                        .status("ACTIVE")
                        .panNumber("ABCDE1234F")
                        .aadharNumber("541278964512")
                        .user(savedCustomer)
                        .build();
                accountRepository.save(customerAccount);
                System.out.println("[DB SEEDER] Created Active Savings Account '1009876543' for customer with balance $5000.00");
            }
        };
    }
}
