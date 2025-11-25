# WhatsApp Chat Application

Ek real-time messaging app jo WhatsApp ki tarah kaam karta hai with live chat functionality.

## Features

- ✅ Real-time messaging with Socket.IO
- ✅ WhatsApp-like UI design
- ✅ Message editing (only by sender)
- ✅ Message deletion (only by sender)
- ✅ Clear all chat functionality
- ✅ PostgreSQL database for message persistence
- ✅ LowDB fallback for local storage
- ✅ Responsive design
- ✅ Multiple users can chat simultaneously
- ✅ User identification and permissions

## Setup Instructions

### 1. PostgreSQL Install Karo

Windows pe PostgreSQL install karne ke liye:
1. https://www.postgresql.org/download/windows/ pe jao
2. Latest version download karo
3. Install karo (default settings rakho)
4. Password set karo jab puchhe (yaad rakhna)

### 2. Database Setup

```bash
cd backend
npm install
node setup-db.js
```

### 3. Environment Variables (.env file create karo)

`backend/.env` file create karo aur yeh daalo:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_chat
DB_USER=postgres
DB_PASSWORD=your_postgres_password
PORT=3000
```

### 4. Server Start Karo

```bash
cd backend
npm start
# OR
npx nodemon server.js
```

### 5. Browser mein Open Karo

http://localhost:3000

## Database Schema

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  user_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /` - Main chat interface
- `WebSocket` - Real-time messaging

## Socket Events

- `notes:init` - Get all existing messages
- `notes:create` - Send new message
- `notes:new` - Receive new message broadcast

## Troubleshooting

### Agar "Cannot connect to database" error aaye:

1. PostgreSQL service running hai ya nahi check karo:
   ```bash
   services.msc
   ```
   Find "postgresql" and make sure it's running

2. Password check karo - pgAdmin mein login kar ke test karo

3. .env file mein correct credentials daalo

### Agar "Port already in use" error aaye:

```bash
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

## 🚨 Important: GitHub Pages Won't Work!

**یہ application GitHub Pages پر نہیں چلے گی** کیونکہ:

- GitHub Pages صرف static files serve کرتی ہے
- ہمارے app کو Node.js server چاہیے
- Socket.io real-time connection کے لیے server required ہے

## 🌐 Deployment Options

### Option 1: Railway (Free & Easy) ⭐ Recommended
1. [Railway.app](https://railway.app) پر signup کریں
2. New project > Deploy from GitHub
3. اپنے GitHub repo کو connect کریں
4. Auto-deploy ہو جائے گا

### Option 2: Render (Free)
1. [Render.com](https://render.com) پر signup کریں
2. New > Web Service
3. GitHub repo connect کریں
4. Build Command: `npm install`
5. Start Command: `node server.js`

### Option 3: Heroku (Free Tier Available)
1. [Heroku.com](https://heroku.com) پر signup کریں
2. New app create کریں
3. GitHub connect کریں
4. Deploy کریں

## 📁 Files to Delete Before GitHub Push

### Delete these before pushing to GitHub:
```bash
# DON'T commit these to GitHub
rm -rf backend/node_modules/
rm backend/db.json  # اگر local database use کر رہے ہیں
```

### Keep these files (commit these):
```
✅ backend/package.json
✅ backend/server.js
✅ backend/database.js
✅ backend/public/index.html
✅ backend/config.js
✅ .gitignore (ہم نے ابھی بنائی)
✅ README.md
```

## Technologies Used

- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL + LowDB fallback
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **Real-time**: WebSockets (Socket.IO)

## Features to Add (Future)

- [ ] User authentication
- [ ] Private messages
- [ ] Message reactions
- [ ] File/image sharing
- [ ] Message search
- [ ] Online/offline status
