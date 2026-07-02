# Calorific

## Project Description

Calorific is a full-stack web and mobile application that allows users to securely manage their own nutrition by tracking calories, macronutrients, food intake, and hydration against personalized daily targets.

The project uses a MERN stack (MongoDB, Express, React, Node.js) with a remote database, with Flutter powering the mobile client, and communicates between client and server using JSON-based API endpoints secured with JWT authentication. The application is hosted remotely and accessed through a domain name.

---

## Team Members

| Team Member | Role |
|---|---|
| Davidson Chase | Web Front-End |
| Hurley Jonathon | Database |
| Nahin Takrim | Web Front-End |
| Sundar Shivram | Project Manager & API |
| Lemon Zachary | Floater |
| Morgan Aidan  | Mobile Front-End |

---

## Technologies Used

- HTML
- CSS (Tailwind)
- JavaScript / TypeScript
- React
- Node.js
- Express
- MongoDB
- Flutter
- JSON
- JWT
- SendGrid
- SwaggerHub
- GitHub

---

## Core Features

- User Registration
- User Login
- Email Verification
- Password Reset
- Add Food Log Entries
- Edit Food Log Entries
- Delete Food Log Entries
- Partial Match Food Search
- Set Calorie & Macro Targets
- Remote Hosting
- RESTful API built with Express 

---

## Local Frontend Setup (Windows):
### Prerequesites: 
- Node.js installed (validate with `node -v` → e.g., `v24.18.0`)
- Npm installed (validate with `npm -v` → e.g., `11.17.0` )
- *HACKY* : Uses version control to revert "Vite" changes to code.  
	- *There is probably a better way...*

---

*We will call the root directory "`Calorific`" for this setup guide.*
*This is where we will begin our Terminal commands from*

1. Clone the Calorific GitHub repository if not already.
2. Create the Frontend (Vite + React + TypeScript). 
```powershell 
npm create vite@latest
```
- Enter `y` to proceed.
- Enter "`frontend`" for the anme of the Project.
- When prompted on how to proceed as frontend is not empty, select `Ignore files and Continue`.
- Select `React`.
- Select `TypeScript`.
- If prompted, select `OxLint`.
- Finally, `Yes`

- (The *HACKY* bit) Using GitHub's VCS, revert/discard the changes Vite made to the files in the project.

3. Add the `tailwindcss` node_module
```powershell
npm install tailwindcss
```
- This did will no longer make a  `import tailwindcss from '@tailwindcss/vite'` 

4. **Run the frontend!**
```powershell
cd frontend
npm run dev
```

>Setup for the backend follows after the steps from the frontend.

## Local Backend Setup (Windows):
### Prerequesites: 
- The same Prerequesites as the Frontend setup.

---

- *You will need to open another Terminal Window*

1. Create Backend (Express + MongoDB)
```powershell
cd backend
npm install
npm install express --save
npm install body-parser
npm install mongodb
npm install cors
```

- (The *HACKY* bit, like before) Using GitHub's VCS, revert/discard the changes Vite made to the files in the project.

## Links
- N/A
  
### GitHub Repository
https://github.com/shivram101/Calorific

### Live Application
[Insert Application Link Here]
