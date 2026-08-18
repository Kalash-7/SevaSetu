# SevaSetu

**SevaSetu** is a rapid volunteer and resource coordination platform built for emergency response. It connects administrators who deploy resources with on-the-ground volunteers equipped to handle crises efficiently. 

By leveraging real-time data and Google's Gemini AI, SevaSetu intelligently matches volunteers to emergencies based on geographic proximity and semantic skill-matching. It also streamlines post-action reporting using Vision AI.

## Key Features

- **Live Operations Map:** Real-time geo-tracking of active deployments via `react-leaflet`.
- **AI Smart Dispatch:** Utilizes `gemini-3.5-flash` to semantically match volunteer skills to critical emergencies.
- **Vision AI Reporting:** Volunteers can upload photos of handwritten field notes, which the AI automatically parses and summarizes.
- **Role-Based Workflows:** Distinct Admin and Volunteer dashboards built on Firebase Authentication.
- **Fully Responsive:** Sleek, modern UI built with Tailwind CSS.

---

## Prerequisites

Before running SevaSetu on your local machine, ensure you have the following installed and configured:

1. **Node.js** (v18.0 or higher) and `npm`
2. **Git**
3. **Firebase Account:** 
   - A Firebase project with **Firestore Database** and **Authentication** (Email/Password) enabled.
4. **Google Gemini API Key:**
   - Obtain an API key from Google AI Studio to power the Smart Match and Vision AI features.

---

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sevasetu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your keys:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view it in the browser.

---

