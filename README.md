# Transcendance - The Ultimate Pong Experience

## Overview

Transcendance is the final capstone project of the 42 Common Core. It is a full-stack web platform that reimagines the classic Pong experience through a modern lens, featuring a microservices architecture, real-time high-fidelity gameplay, and a complete social suite.

While this was a massive collaborative effort, I focused on the **core engine and backend infrastructure**. My implementation of the server-side physics and the multi-device socket orchestration became the backbone of our platform, ensuring a cheat-proof and low-latency experience for all users.

![Game Demonstration GIF](transcendance.gif)

## Core Features
* **Real-Time Engine:** High-performance multiplayer powered by **WebSockets (Fastify-Websocket)** with authoritative server-side physics validation.
* **Competitive Ranking:** Integrated **ELO rating system** and global leaderboards to track player progression and skill levels.
* **Social & Challenges:** Real-time friend/block management and a direct **Challenge System** allowing players to invite each other to matches.
* **Secure Auth Stack:** Advanced security featuring **OAuth (Github)** integration and **Two-Factor Authentication (2FA)** via TOTP.
* **Competitive Tiers:** Automated tournament system with bracket generation and real-time match-making.
* **Custom Frontend:** A lightweight, vanilla **TypeScript Single Page Application Framework** built from scratch to handle dynamic routing and state management without external UI libraries.
* **Hybrid Interface:** Playable via a modern **3D Web UI (Babylon.js)** or a headless **CLI Terminal client** over SSH.

## The Architecture & Logic
* **Authoritative Server:** To prevent cheating, all physics calculations (vectors, collisions, trajectories) are handled server-side in **Node.js**, ensuring frame-perfect consistency across clients.
* **Fastify Framework:** Chosen for its extreme performance and schema-based validation, allowing for a highly scalable and type-safe API.
* **Socket Orchestration:** Implemented a hierarchical session system ($UserId \to AuthToken \to SessionUUID$) allowing simultaneous multi-device connectivity without state conflicts.
* **Microservices Deployment:** The entire stack **Fastify, PostgreSQL, and Nginx** is fully containerized using **Docker Compose**.

## My Contributions

I architected the primary API bridge and the real-time game logic. Below are the technical pillars I owned during the development:

| Feature | Technical Implementation |
| :--- | :--- |
| **Game Engine** | Built a polymorphic controller handling 1vs1 Online, AI Bots, and Local play with a unified vector physics engine. |
| **Real-Time Infra** | Designed the WebSocket lifecycle logic, including anti-exploit guardrails to prevent "multi-window" gameplay. |
| **RESTful API** | Developed a robust **Node.js** backend with Data Transfer Object validation and Prisma persistence. |
| **Headless Client** | Created an SSH-ready CLI client using protocol decoupling to prove the backend's versatility. |

## Tech Stack

* **Backend:** Node.js (Fastify), Prisma (ORM), Fastify-WebSocket.
* **Frontend:** Babylon.js for 3D rendering, TypeScript.
* **Database:** PostgreSQL.
* **DevOps:** Docker, Nginx, Redis.

### The Team
This project was a collaborative effort at 42.
* **[Quentin Morineau](https://github.com/qmorineau):** Backend Lead, Game Engine, WebSocket Architecture.
* **[Nathan Lebrun](https://github.com/gazhonsepaskwa):** Frontend Architecture & UI/UX Design.
* **[Loïc Deridder](https://github.com/lderidde):** DevOps, Database Schema & AI Logic.

---
*Developed as the final project of the 42 Common Core.*
