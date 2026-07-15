# JUSTIN AI — Next-Gen Intelligence 🌌

JUSTIN AI is a futuristic, sleek, and highly responsive chatbot powered by Google Gemini. It features a stunning glassmorphism UI, interactive AI orbs, and a persistent conversation history.


## ✨ Features

-   **Futuristic UI**: Modern glassmorphism design with Aurora background effects.
-   **Interactive AI Orb**: A dynamic, glowing orb that reacts to AI states (Processing/Ready).
-   **Intelligent Conversations**: Powered by the `gemini-2.5-flash` model for fast and accurate responses.
-   **Context Awareness**: Remembers previous messages in a session for coherent dialogues.
-   **Persistent History**: Saves your conversations locally so you can return to them later.
-   **Responsive Design**: Fully optimized for both desktop and mobile devices.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   An API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/chatbot-gemini.git
    cd chatbot-gemini
    ```

2.  **Setup the Backend**:
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory based on `.env.example`:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    PORT=3001
    ```

3.  **Setup the Frontend**:
    ```bash
    cd ../frontend
    npm install
    ```

### Running the App

To run the application locally, you need to start both the backend and the frontend.

1.  **Start Backend**:
    ```bash
    cd backend
    npm start
    ```

2.  **Start Frontend**:
    ```bash
    cd ../frontend
    npm run dev
    ```

The app will be available at `http://localhost:5173`.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, Framer Motion (for animations), Vanilla CSS.
-   **Backend**: Node.js, Express, Google Generative AI SDK.
-   **AI Model**: Google Gemini 2.5 Flash.

---
