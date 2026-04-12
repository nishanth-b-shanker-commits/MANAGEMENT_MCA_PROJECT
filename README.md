# NexaPort - Port Management System

Welcome to the NexaPort Port Management System Frontend. This project was developed as a modern Single-Page Application (SPA) using purely vanilla HTML, CSS, and JS (No frameworks required). 

## Features
- **Role-based Dashboards:** Access as Admin, Ship Agent, Port Authority, Customs, or Health Officer.
- **Port Clearance Workflows:** Track tracking and simulated PDF clearance processing.
- **Vessel Management:** Registry mockups with custom inputs.
- **Responsive Layout:** Dynamic grid and collapsing sidebars with glassmorphism interactions.

## Local Development
To run this application locally and explore all the features:
1. Open your terminal in this repository's folder.
2. If you have Python installed, run a quick local server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and go to `http://localhost:8000`.

## Deployment to GitHub Pages
To host this website live on the internet using GitHub pages:

### 1. Push to GitHub
1. Create a **New Repository** on your GitHub account (leave it empty).
2. Open your terminal in this folder and configure the local repository to point to your new GitHub repository:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```
   *(Make sure to swap out `YOUR-USERNAME` and `YOUR-REPO-NAME` for the actual URL!)*

### 2. Enable GitHub Pages
1. Go to your repository **Settings** on GitHub.
2. Select **Pages** on the left menu.
3. Under "Build and deployment", set source to **Deploy from a branch**.
4. Select the **main** branch, `/ (root)` folder, and click **Save**.
5. Wait a minute, and your site will be live!
