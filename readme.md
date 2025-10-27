# Homework — Module 2: Online Chat

_(Currently, only part of the task is implemented)_

## Project Structure

**Project name:** `java-rush-chat-backend`
db/
└── .env # Environment setup (argument=value)
index.html # Login page
chat.html # Chat page
web/
└── assets/
└── img/
└── index.js
└── styles/
└── index.css # Includes main.css (herocat.css + join.css) and chat.css backend/
└── src/
.gitignore

## Figma Design

[Figma link](https://www.figma.com/design/jaHJ1ePOuMYfIXEWOItsay/Module-2-Online-Chat--Share-?node-id=18-29&t=bP7khixrkdwIPFbH-0)

---

## Pre-conditions

### Install Node.js

```bash
node -v       # Check version (I use v22.12.0)

### Install dependencies:
npm install

### Run Adminer (first time)
docker run -d -p 8080:8080 --name adminer --network js-rush-1900 adminer

### How to Run the Project

1. Run the Database
. Install Docker Desktop

. Open Docker Desktop → Containers

. Run the previously created database (e.g., java-rush-proj-bd1, port 5432:5432)

. Run Adminer (e.g., container name: adminer, port 8080:8080)

. Open Adminer: http://localhost:8080

Adminer Login:
. System: PostgreSQL

. Server: host.docker.internal:5432

. Username / Password / Database: from .env file

. Click Login

You’ll see SQL tables: messages, users.


### Open the Project
Repository:

. Branch: new_branch3 (latest changes)

. Or go to master and switch to the latest branch


### Development Setup (Visual Studio Code)
Initialize project
npm init
tsc --init

###Install Typescript
npm install --save-dev typescript

### Update tsconfig.json

{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "target": "es6",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]}

### Compile and run
tsc
###Or add a script to package.json:
"scripts": {
  "start": "tsc && node dist/index.js"}
###Then run:
npm run start

### Docker run:
docker compose up --build
docker-compose up -d --build

###Open browsers and check links:
http://localhost/	 frontend (from folder web/)
http://localhost/api/	Proxi to backend via nginx
http://localhost:3001/health	Access to backend

###Check logs
docker-compose logs backend
docker-compose logs nginx
docker-compose logs db

###Stop the project
docker-compose down

##Serve Frontend
npx serve .

. Local: http://localhost:3000

. Network: http://192.168.0.101:3000

Open in browser to view the chat interface.
```
