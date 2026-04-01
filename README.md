# KLTN - Website Thiet Bi Cong Nghe (Node.js)

Du an gom 2 phan:
- `backend`: API Node.js/Express + MySQL
- `frontend`: giao dien web tinh

## 1. Yeu cau moi truong
- Node.js 18+
- MySQL 8+

## 2. Cai dat nhanh
### Buoc 1: Cai dependencies
```bash
cd backend
npm install
```

### Buoc 2: Tao file env
```bash
cp .env.example .env
```
Tren Windows PowerShell:
```powershell
Copy-Item .env.example .env
```
Sau do cap nhat gia tri trong `.env` (db password, jwt secret, ...).

### Buoc 3: Import database
Tu thu muc goc repo:
```bash
mysql -u root -p < CSDL_DoAnCN.sql
```

### Buoc 4: Chay backend
```bash
cd backend
npm start
```
Mac dinh API chay tai: `http://localhost:3000`

### Buoc 5: Chay frontend
Mo file `frontend/index.html` bang Live Server hoac bat ky static server nao.

## 3. Kiem tra nhanh
Tu thu muc `backend`:
```bash
npm test
```
Script smoke test se:
- Bat server tam tren cong 3900
- Goi endpoint `/`
- Goi `/api/auth/login` voi payload rong va ky vong HTTP 400

## 4. Bien moi truong quan trong
Bat buoc:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `SESSION_SECRET`

Tuy chon:
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Mail OTP: `EMAIL_USER`, `EMAIL_PASSWORD`
- Chatbot: `GROQ_API_KEY`
- MoMo: `MOMO_*`

## 5. Tai lieu chi tiet
- `backend/AUTH_README.md`
- `backend/HUONG_DAN_TEST.md`
- `ADMIN_STRUCTURE.md`
- `SETUP_ADMIN_SUMMARY.md`
