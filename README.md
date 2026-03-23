# Microservices - Node.js

A scalable **microservices-based backend system** for a social media application, built using Node.js, Express, MongoDB, Redis, and RabbitMQ. The architecture is designed for **high scalability, loose coupling, and real-world backend practices**.

---

## 🧠 Architecture Overview

This project follows a **microservices architecture** where each service is independently deployable and communicates via APIs and message queues.

### 🔧 Services

* **API Gateway** – Entry point for all client requests
* **User Service** – Handles authentication and user management
* **Post Service** – Manages posts and associated data
* **Media Service** – Handles file uploads (Cloudinary integration)
* **Search Service** – Enables search functionality
* **Redis** – Caching and rate limiting
* **RabbitMQ** – Event-driven communication between services

---

## ⚙️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Caching:** Redis
* **Messaging Queue:** RabbitMQ
* **Cloud Storage:** Cloudinary
* **Containerization:** Docker, Docker Compose
* **Logging:** Custom logger (Winston/Pino)

---

## 🔥 Key Features

* ✅ Microservices architecture
* ✅ API Gateway routing
* ✅ Redis-based caching and rate limiting
* ✅ Event-driven communication using RabbitMQ
* ✅ Secure media upload with Multer + Cloudinary
* ✅ Automatic media cleanup on post deletion
* ✅ Authentication middleware (header-based)
* ✅ Scalable and loosely coupled services

---

## 📁 Project Structure

```
Microservices/
│
├── api_gateway/
├── user_service/
├── post_service/
├── media_service/
├── search_service/
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### 🔧 Prerequisites

* Node.js (v18+ recommended)
* Docker & Docker Compose
* MongoDB (local or cloud)
* Cloudinary account

---

### 🛠️ Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

2. Add `.env` files in each service:

Example:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://rabbitmq:5672
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret
```

---

### 🐳 Run with Docker

```bash
docker-compose up --build
```

---

## 🔁 API Flow Example

### 1️⃣ Upload Media

```http
POST /api/media/upload
Headers:
x-user-id: 123
```

Response:

```json
{
  "mediaId": "abc123",
  "url": "cloudinary-url"
}
```

---

### 2️⃣ Create Post

```http
POST /api/posts
Headers:
x-user-id: 123
```

Body:

```json
{
  "content": "My post",
  "media": [
    "media_id"
  ]
}
```

---

### 3️⃣ Delete Post (Event Driven)

* Post service emits event → RabbitMQ
* Media service consumes event
* Deletes media from:

  * Cloudinary
  * MongoDB

---

## 🔄 Event-Driven Communication

* RabbitMQ is used for asynchronous communication
* Example:

  * `POST_DELETED` event triggers media cleanup
* Ensures **loose coupling between services**

---

## 🧪 Testing

You can use:

* Postman
* Thunder Client

Make sure to include headers:

```http
x-user-id: <user_id>
```

---

## 📈 Future Improvements

* API Gateway with NGINX
* JWT-based authentication
* Kubernetes deployment
* CI/CD pipeline
* Service discovery

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---


