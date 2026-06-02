# Smart Expense Tracker

## Project Description

This project is based on Assignment 1, I added on login/out function, make users data more private and secure. I also added on create/deactivate category to organize the expenses more tidy.

---

## Main Features

### User Authentication

* Users can register a new account.
* Users can log in using username and password.
* Passwords are hashed before being stored in the database.
* JWT authentication is used to protect private routes and user data.
* Users can log out and return to the landing page.
* The account page displays the current user's username, email, role, and login status.

### Expense Management

* Users can create new expense records.
* Users can view their own expense records.
* Users can update existing expenses.
* Users can delete expenses.
* Each expense is linked to the currently logged-in user through `user_id`.
* Users cannot view or manage another user's expenses.

### Category Management

* Default categories are available to all users.
* Users can create their own custom categories.
* Custom categories are user-specific and do not appear in other users' accounts.
* Default categories cannot be deleted.
* Custom categories can be deactivated.
* Deactivated categories are removed from future selection, but old expense records still keep their original category names.

### Dashboard and Data Analysis

* The dashboard shows total spending, number of records, and highest expense.
* A pie chart shows the spending proportion across categories for a selected month.
* A bar chart compares category spending across a selected month range.
* Recent expense records are shown on the dashboard.
* Charts are calculated from the current user's expense data only.

### Search and Filter

* Users can search expenses by title or note.
* Users can filter expense records by category.
* Filtered total spending is displayed based on the current search and category filter.

---

## Conceptual Entities

This application involves three main conceptual entities:

### 1. User

The `User` entity represents an account in the system.

Main fields:

* `id`
* `username`
* `email`
* `hashed_password`
* `role`

Main functions:

* Register
* Login
* Retrieve current user
* Authenticate user with JWT

### 2. Expense

The `Expense` entity represents a spending record created by a user.

Main fields:

* `id`
* `title`
* `category`
* `amount`
* `date`
* `note`
* `user_id`

Main functions:

* Create expense
* Read expenses
* Update expense
* Delete expense
* Search and filter expenses
* Link each expense to the logged-in user

### 3. Category

The `Category` entity represents expense categories.

Main fields:

* `id`
* `name`
* `description`
* `is_default`
* `is_active`
* `user_id`

Main functions:

* Read available categories
* Create custom category
* Deactivate custom category
* Protect default categories from deletion
* Separate custom categories by user account

---

## Technical Stack

### Frontend

* React
* Vite
* React Router
* Recharts
* CSS

### Backend

* FastAPI
* SQLModel
* SQLite
* Uvicorn

### Authentication and Security

* JWT authentication
* Password hashing with Passlib and bcrypt
* OAuth2 password flow through FastAPI
* Protected API endpoints for user-specific expenses and categories

---

## Folder Structure

```text
POTI Assignment 2/
├── BackEnd/
│   ├── main.py
│   ├── expenses.db
│   └── requirements.txt
│
├── frontend-react/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── AuthModal.jsx
│       │   └── Navigationbar.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Expenses.jsx
│       │   └── Profile.jsx
│       └── services/
│           └── api.js
│
└── README.md
```

### BackEnd

The `BackEnd` folder contains the FastAPI backend application.
`main.py` defines the database models, authentication logic, and API endpoints.
`expenses.db` is the SQLite database used by the application.
`requirements.txt` lists the Python dependencies required to run the backend.

### frontend-react

The `frontend-react` folder contains the React frontend application.
`App.jsx` controls the main application layout and login state.
`AuthModal.jsx` handles login and registration modal windows.
`Navigationbar.jsx` displays navigation options after login.
`Dashboard.jsx` displays spending summaries and charts.
`Expenses.jsx` handles expense CRUD, category management, search, and filters.
`Profile.jsx` displays current account information.
`api.js` contains frontend API request functions for backend communication.

---
## Downloading the Project from GitHub

To run this project on a local machine, first clone the public GitHub repository:

```bash
git clone https://github.com/Trodean/Track-Expenses-for-good.git
```

Then move into the project folder:

```bash
cd Track-Expenses-for-good
```

After cloning the repository, run the backend and frontend separately by following the setup instructions below.

--

## How to Run the Application

The backend and frontend must be run in separate terminals.

---

## Backend Setup

Open a terminal in the project folder and run:

```bash
cd BackEnd
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

The FastAPI documentation can be opened at:

```text
http://127.0.0.1:8000/docs
```

The backend will run at:

```text
http://127.0.0.1:8000
```

The FastAPI documentation can be opened at:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

Open another terminal in the project folder and run:

```bash
cd frontend-react
npm install
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

---

## How to Use the Website

1. Open the frontend website in a browser.
2. The landing page will appear before login.
3. Click **Register** to create a new account.
4. Click **Login** to log in with an existing account.
5. After login, the user can access:

   * Dashboard
   * Expenses
   * Account
6. In the Expenses page, the user can:

   * Add expenses
   * Edit expenses
   * Delete expenses
   * Search expenses
   * Filter expenses by category
   * Add custom categories
   * Deactivate custom categories
7. In the Dashboard page, the user can:

   * View total spending
   * View highest expense
   * View recent expenses
   * Analyse monthly category ratios with a pie chart
   * Compare category spending across months with a bar chart
8. Click **Logout** to return to the landing page.

---

## API Endpoints

### Authentication

```text
POST /register
POST /token
GET /me
```

### Expenses

```text
GET /expenses
POST /expenses
PUT /expenses/{expense_id}
DELETE /expenses/{expense_id}
```

### Categories

```text
GET /categories
POST /categories
DELETE /categories/{category_id}
```

---

## Security Design

JWT keeps your data safe on the app. When you log in, the front end saves your access token to `localStorage` and you send it in API requests as a bearer token in the `Authorization`.

Expense and category can’t be used or seen by unauthenticated users; they can’t see your private info. Every expense has a `user_id` so it can be linked to the user, and all custom categories have a `user_id` that is linked to the creator.

The app makes sure that passwords are not sent as plain text. Instead, they are saved in the database as a hash.

For the possible future role-based access control, the app has a `role` field in the User model. Right now, it’s more focused on personal user-specific management.

---

## Design Rationales

On the very first page, before users log in, they only see a login/register page. Users can see their dashboard, expense entries, category entries, and account details after logging in.

The design of the interface uses cards, modal login and registration forms, and a limited color palette, which keeps the design neat and easy to use. The purpose of the dashboard is separated into charts. A pie chart shows a selected month’s spending category proportions, while a selected month range’s spending category proportions are shown in a bar chart

Instead of deleting a custom category, the category system, with deactivated custom categories, prevents expense records from losing their category when the custom category is deleted.

---

## Notes

This project only allows for local development and demonstrations. The JWT secret key here is for development only. In production systems, sensitive configurations are stored in environment variables.


