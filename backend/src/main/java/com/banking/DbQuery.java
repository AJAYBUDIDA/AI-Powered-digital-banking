package com.banking;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbQuery {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/digital_banking?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String username = "root";
        String password = "root";

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            try (Connection conn = DriverManager.getConnection(url, username, password);
                 Statement stmt = conn.createStatement()) {

                System.out.println("=== USERS ===");
                try (ResultSet rs = stmt.executeQuery("SELECT id, username, first_name, last_name, email FROM users")) {
                    while (rs.next()) {
                        System.out.printf("ID: %d | Username: %s | Name: %s %s | Email: %s%n",
                                rs.getLong("id"),
                                rs.getString("username"),
                                rs.getString("first_name"),
                                rs.getString("last_name"),
                                rs.getString("email"));
                    }
                }

                System.out.println("\n=== ACCOUNTS ===");
                try (ResultSet rs = stmt.executeQuery("SELECT id, account_number, account_type, balance, status, user_id FROM accounts")) {
                    while (rs.next()) {
                        System.out.printf("ID: %d | Number: %s | Type: %s | Balance: %s | Status: %s | UserID: %d%n",
                                rs.getLong("id"),
                                rs.getString("account_number"),
                                rs.getString("account_type"),
                                rs.getBigDecimal("balance"),
                                rs.getString("status"),
                                rs.getLong("user_id"));
                    }
                }

                System.out.println("\n=== CARDS ===");
                try (ResultSet rs = stmt.executeQuery("SELECT id, account_id, card_number, card_type, status FROM cards")) {
                    while (rs.next()) {
                        System.out.printf("ID: %d | AccountID: %d | Number: %s | Type: %s | Status: %s%n",
                                rs.getLong("id"),
                                rs.getLong("account_id"),
                                rs.getString("card_number"),
                                rs.getString("card_type"),
                                rs.getString("status"));
                    }
                }

            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
