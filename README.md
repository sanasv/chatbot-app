# 🧠 AI Job Assistant Chatbot

An interactive AI-powered chatbot that helps users evaluate how well their CV matches a given job description, offering concise, tailored advice and feedback. The app uses LLMs (Groq API with LLaMA3), Flask, and a full React frontend, deployed via Docker and Kubernetes.

## 🚀 Features

* 📄 Upload your **CV** (PDF, DOCX, TXT).
* 📝 Input a **job description**.
* 💬 Chatbot interface for **interactive Q\&A**.
* ✨ Real-time responses with **typing animation** and chat bubbles.
* 🔁 Ability to reset and upload a new job description without re-uploading the CV.
* 🌐 Fully deployed using **Docker** and **Kubernetes**.

---

## 🛠️ Tech Stack

* **Frontend:** React, HTML/CSS, JavaScript
* **Backend:** Python (Flask), Groq API (LLaMA3)
* **LLM Integration:** Groq’s `llama3-8b-8192` model
* **Deployment:** Docker, Kubernetes
* **Text Extraction:** PyPDF2, python-docx, plain text parsing
* **Session Management:** Flask sessions

---

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/sanasv/chatbot-app.git
cd chatbot-app
```

### 2. Add Environment Variables

Create a `.env` file:

```
GROQ_API_KEY=your_actual_groq_api_key_here
```

> Don’t forget to update `.gitignore` to exclude `.env` and secret files.

### 3. Docker Build & Run Locally

```bash
docker build -t chatbot-app .
docker run -p 5000:5000 --env-file .env chatbot-app
```

### 4. Deploy on Kubernetes

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

---

## 🌐 Live Demo

🔗 [Try the AI Job Assistant Chatbot here](https://chatbot-app-hwia.onrender.com)
---

## 🧠 Example Questions

* *Am I a good fit for this role?*
* *What should I highlight in my application?*
* *Which skills should I improve to match this job?*
* *How do my projects align with this job?*

