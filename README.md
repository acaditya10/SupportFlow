# SupportFlow 💬 | Professional Real-Time Support Terminal

**SupportFlow** is a high-performance, full-stack customer engagement platform designed for seamless, one-to-many communication. Built with a "jaw-dropping" modern UI, it provides a centralized dashboard for administrators to manage multiple real-time customer inquiries simultaneously.

### 🚀 [Live Demo](https://support-flow-365.web.app)

---

## 📖 Table of Contents
- [Project Vision](#-project-vision)
- [Key Features](#-key-features)
- [Technical Stack](#-technical-stack)
- [Architecture & Engineering](#-architecture--engineering)
- [Database Schema](#-database-schema)
- [Security Implementation](#-security-implementation)
- [Local Setup](#-local-setup)
- [Deployment](#-deployment)

---

## 🎯 Project Vision
Traditional chat apps focus on user-to-user interaction. **SupportFlow** is architected for service-based environments:
- **Admin Role:** A specialized "Support Agent" interface with a split-screen dashboard to monitor the entire user queue.
- **User Role:** A simplified, focused portal designed for 1-on-1 assistance with high-priority response times.

---

## ✨ Key Features

### 🖥️ Advanced UI/UX Dashboard
- **Admin Terminal:** Features a sophisticated dual-pane layout. The sidebar provides a real-time list of customers (sorted by activity), while the main window provides a context-switching chat interface.
- **User Portal:** A centered, premium chat card designed for high readability and focus.
- **Theme Engine:** Integrated **Dark and Light mode** with smooth transitions. Preferences are persisted in `localStorage` to ensure a consistent experience across sessions.
- **Responsive Design:** A mobile-first approach using Tailwind CSS. The Admin dashboard intelligently switches from a split-pane to a single-pane navigation on smaller screens.

### ⌨️ Real-Time Interactivity
- **Instant Messaging:** Powered by Firebase's WebSocket-based `onSnapshot` listeners, achieving sub-100ms message synchronization.
- **Typing Indicators:** Real-time animated "jumping dots" feedback.
- **Smart Debounce Logic:** Implemented a `setTimeout` based cleanup to ensure the typing status automatically clears if a user stops typing for 2 seconds.

---

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | React.js (v18+) |
| **Build Tool** | Vite |
| **Backend / DB** | Firebase Firestore (NoSQL) |
| **Authentication** | Firebase Auth (Email/Password) |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Hosting** | Firebase Hosting |

---

## 🏗️ Architecture & Engineering

### 1. One-to-Many Logic
The application uses a **Room-based Messaging Architecture**. 
- Every customer is assigned a unique `UID`.
- A chat "room" is defined by this `UID` in the Firestore `chats` collection.
- The Admin can dynamically subscribe to any room, while the User is programmatically locked into their own specific room.

### 2. Performance Optimization
- **Auto-Scrolling:** Utilized React `useRef` to create an anchor point that automatically scrolls the chat to the newest message upon data updates.
- **Memory Management:** Implemented cleanup functions in all `useEffect` hooks to unsubscribe from Firestore listeners, preventing memory leaks and unnecessary billing.
- **Atomic Updates:** Used `serverTimestamp()` to ensure message ordering is consistent across all time zones.

---

## 📊 Database Schema

### `users` (Collection)
Tracks status and metadata for the sidebar.
```json
{
  "email": "customer@example.com",
  "lastActive": "timestamp",
  "isTyping": true,
  "typingTo": "ADMIN_ID"
}
```

### `chats` (Collection)
Stores messages for each room.
```json
{
  "roomId": "USER_UID",
  "messages": [
    {
      "senderId": "USER_UID",
      "text": "Hello, I need help!",
      "timestamp": "serverTimestamp"
    }
  ]
}
```

---

## 🔒 Security Implementation
- **Authentication:** Firebase Auth ensures secure login for admins and users. Passwords are hashed and stored securely.
- **Authorization:** Role-based access control restricts admin features to authenticated support agents only.
- **Data Encryption:** All data in transit is encrypted via HTTPS. Firestore handles data at rest encryption.
- **Input Validation:** Client-side and server-side validation prevents injection attacks and ensures data integrity.
- **Rate Limiting:** Implemented to prevent abuse, such as excessive message sending.

---

## 🛠️ Local Setup
1. **Prerequisites:**
   - Node.js (v16+)
   - npm or yarn
   - Firebase CLI

2. **Clone the Repository:**
   ```bash
   git clone https://github.com/acaditya10/support-flow.git
   cd support-flow
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Firebase Setup:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore, Authentication, and Hosting.
   - Create a `.env` file in the root directory and add your Firebase config variables (see `.env` example above).

5. **Run Locally:**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5173`.

---

## 🚀 Deployment
1. **Build the Project:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   firebase login
   firebase init  # Select Hosting and Firestore
   firebase deploy
   ```

3. **Environment Variables:**
   - Set production Firebase config in Firebase Hosting settings.
   - Ensure domain is configured for the live demo URL.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Contact
For questions, reach out to [your-email@example.com](mailto:your-email@example.com).