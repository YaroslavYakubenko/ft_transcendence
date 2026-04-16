# Transcendence MVP Module Selection

## Overview
This document lists all selected modules for the ft_transcendence project MVP, including their category and point value according to the subject.

Total required: **14 points**  
Current total: **18 points**

---

## 🟣 Major Modules (+2 each)

### Web
- **Use a framework for frontend and backend** (+2)
  - Backend: Django
  - Frontend: SPA framework

- **Real-time features (WebSockets)** (+2)

### User Management
- **Standard user management and authentication** (+2)

### Gaming and User Experience
- **Web-based game (Chess)** (+2)
- **Remote players (online multiplayer)** (+2)

---

## 🔵 Minor Modules (+1 each)

### Web
- **Use a frontend framework (SPA)** (+1)
- **Use an ORM for the database** (+1)

### User Management
- **OAuth 2.0 authentication** (+1)
- **Two-Factor Authentication (2FA)** (+1)
- **Game statistics and match history** (+1)

### Gaming and User Experience
- **Tournament system** (+1)

### Accessibility & Internationalization
- **Support for additional browsers** (+1)
- **Support for multiple languages (i18n)** (+1)

---

## ⚙️ DevOps / Infrastructure (Required, 0 points)

These are mandatory for the project but do not count toward module points:

- Containerize Django backend
- Containerize frontend
- Containerize PostgreSQL database
- Docker Compose (single-command startup)
- Environment variable management (.env)
- Django entrypoint / startup script
- Persistent media storage (avatars)
- HTTPS reverse proxy
- Health checks and service reliability

---

## 📊 Total Points

- Major modules: 5 × 2 = **10 points**
- Minor modules: 8 × 1 = **8 points**

**Total = 18 points**

---

## 🧠 Notes

- This selection provides a buffer above the required 14 points.
- Core dependencies:
  - Authentication → required before OAuth and 2FA
  - Game → required before stats and tournaments
  - WebSockets → required for multiplayer
- DevOps tasks ensure the project meets mandatory technical requirements.

---

## ✅ MVP Strategy

Focus order:
1. Infrastructure (DevOps)
2. Authentication system
3. Chess game (local)
4. Real-time multiplayer
5. Stats and tournaments
6. Optional enhancements (i18n, browser support)

---
