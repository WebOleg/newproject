# CI/CD Pipeline Documentation

**Project:** Tether - Debt Collection Platform  
**Version:** 1.1  
**Date:** December 2025

---

## 1. CI/CD System Overview

CI/CD (Continuous Integration / Continuous Deployment) is an automated system that allows code to be automatically deployed to the server after each push to the repository. This significantly simplifies the development process and reduces the likelihood of errors during manual deployment.

### 1.1 Current Configuration

| Component | Value |
|-----------|-------|
| **GitHub Repository** | ThomasBlake777/Tether-Project |
| **Live Website** | http://testingiscool.online |
| **Server IP** | 68.183.103.79 |
| **Hosting Provider** | BitLaunch (DigitalOcean) |
| **OS** | Ubuntu 25.04 x64 |
| **Project Path** | /var/www/melinux |
| **Process Manager** | PM2 |
| **CI/CD Tool** | GitHub Actions |
| **Deploy Branch** | main |
| **Server SSH Key** | ~/.ssh/id_tether |

---

## 2. How CI/CD Pipeline Works

### 2.1 Workflow Diagram

The automatic deployment process works as follows:

1. Developer makes changes to code locally
2. Executes \`git commit\` and \`git push origin main\`
3. GitHub receives new code and triggers GitHub Actions workflow
4. GitHub Actions connects to the server via SSH (using SSH_PRIVATE_KEY secret)
5. Commands are executed on server: git pull, npm install, npm run build
6. PM2 restarts the application with new code
7. New code is available on http://testingiscool.online within 10-15 minutes

### 2.2 Configuration File

**Location:** \`.github/workflows/deploy.yml\`

\`\`\`yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - uses: appleboy/ssh-action@v1.0.0
        with:
          host: 68.183.103.79
          username: root
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          command_timeout: 25m
          script: |
            cd /var/www/melinux
            git pull origin main
            npm install --legacy-peer-deps
            npm run build
            pm2 restart all
\`\`\`

---

## 3. SSH Keys Configuration

The CI/CD pipeline uses SSH keys for secure authentication between GitHub Actions and the server.

### 3.1 Key Locations

| Location | Description |
|----------|-------------|
| **Server Private Key** | ~/.ssh/id_tether (on server) |
| **Server Public Key** | ~/.ssh/id_tether.pub (on server) |
| **GitHub Secret** | SSH_PRIVATE_KEY (contains id_tether private key) |
| **GitHub Deploy Key** | Repo Settings → Deploy keys (id_tether.pub) |
| **Server authorized_keys** | ~/.ssh/authorized_keys (contains id_tether.pub) |

### 3.2 GitHub Secrets

**Path:** GitHub → Repository → Settings → Secrets and variables → Actions

| Secret Name | Description |
|-------------|-------------|
| \`SSH_PRIVATE_KEY\` | Private SSH key (~/.ssh/id_tether) for server access |

---

## 4. Daily Development Workflow

### 4.1 Developer Commands

**Make changes and deploy:**

\`\`\`bash
git add .
git commit -m "Description of changes"
git push origin main
\`\`\`

**Check deploy status:**

GitHub → Actions → View latest workflow run

**Connect to server:**

\`\`\`bash
ssh root@68.183.103.79
\`\`\`

**View server logs:**

\`\`\`bash
pm2 logs
pm2 status
\`\`\`

---

## 5. Scaling for Tether Project

### 5.1 Recommended Architecture

For a production-ready system, the following structure is recommended:

| Environment | Branch | Purpose |
|-------------|--------|---------|
| **Production** | main | Live server for clients |
| **Staging** | develop | Testing before production |
| **Development** | feature/* | New feature development |

### 5.2 Additional Features for Implementation

- **Automated Testing** - run Jest/Vitest before deployment
- **Linting** - ESLint code check before deployment
- **TypeScript Check** - type validation before deployment
- **Slack/Telegram Notifications** - alerts for successful/failed deployments
- **Database Migrations** - automatic migration execution
- **Docker Containerization** - containerization for better isolation
- **Rollback Mechanism** - ability to revert to previous version
- **Health Checks** - verify functionality after deployment

---

## 6. Security

### 6.1 Current Security Measures

- SSH keys instead of passwords for authentication
- Private repository on GitHub
- Secrets stored in GitHub Secrets, not in code
- .env.local excluded from repository via .gitignore
- Deploy key with limited access for server → GitHub communication

### 6.2 Recommendations for Enhanced Security

1. Create a dedicated deploy user (not root)
2. Configure firewall (UFW) on server
3. Use fail2ban for brute force protection
4. Regularly update dependencies (npm audit)
5. Configure SSL/HTTPS via Nginx + Let's Encrypt

---

## 7. Resources

- **Live Website:** http://testingiscool.online
- **GitHub Repository:** github.com/ThomasBlake777/Tether-Project
- **GitHub Actions:** github.com/ThomasBlake777/Tether-Project/actions
- **Server IP:** 68.183.103.79

---

**Last Updated:** December 2025
