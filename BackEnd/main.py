from typing import Optional, List
from pathlib import Path
from datetime import datetime, timedelta, timezone
import sqlite3

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import SQLModel, Field, Session, create_engine, select



# Expense Models

class Expense(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  title: str
  category: str
  amount: float
  date: str
  note: str = ""
  user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)


class ExpenseCreate(SQLModel):
  title: str
  category: str
  amount: float
  date: str
  note: str = ""


class ExpenseUpdate(SQLModel):
  title: str
  category: str
  amount: float
  date: str
  note: str = ""

# Category Models

class Category(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  name: str = Field(index=True)
  description: str = ""
  is_default: bool = False
  is_active: bool = True
  user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)


class CategoryCreate(SQLModel):
  name: str
  description: str = ""



# User Models

class User(SQLModel, table=True):
  id: Optional[int] = Field(default=None, primary_key=True)
  username: str = Field(index=True)
  email: str = Field(index=True)
  hashed_password: str
  role: str = "user"


class UserCreate(SQLModel):
  username: str
  email: str
  password: str


class UserRead(SQLModel):
  id: int
  username: str
  email: str
  role: str


# App Setup

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)



# Database Setup


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "expenses.db"
sqlite_url = f"sqlite:///{DATABASE_PATH}"

print("Using database:", DATABASE_PATH)

engine = create_engine(sqlite_url, echo=False)

DEFAULT_CATEGORIES = [
  "Bills",
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Other",
]

# Auth Setup

SECRET_KEY = "change-this-secret-key-before-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Database Initialisation

def ensure_expense_user_id_column():
  conn = sqlite3.connect(DATABASE_PATH)
  cur = conn.cursor()

  cur.execute("PRAGMA table_info(expense);")
  columns = [column[1] for column in cur.fetchall()]

  if "user_id" not in columns:
    cur.execute("ALTER TABLE expense ADD COLUMN user_id INTEGER;")

  conn.commit()
  conn.close()

def ensure_category_user_id_column():
  conn = sqlite3.connect(DATABASE_PATH)
  cur = conn.cursor()

  cur.execute("PRAGMA table_info(category);")
  columns = [column[1] for column in cur.fetchall()]

  if "user_id" not in columns:
    cur.execute("ALTER TABLE category ADD COLUMN user_id INTEGER;")

  conn.commit()
  conn.close()


def assign_existing_expenses_to_first_user():
  with Session(engine) as session:
    first_user = session.exec(
      select(User).order_by(User.id)
    ).first()

    if not first_user:
      return

    expenses_without_user = session.exec(
      select(Expense).where(Expense.user_id == None)
    ).all()

    for expense in expenses_without_user:
      expense.user_id = first_user.id
      session.add(expense)

    session.commit()

def create_db_and_tables():
  SQLModel.metadata.create_all(engine)
  ensure_expense_user_id_column()
  ensure_category_user_id_column()

  with Session(engine) as session:
    for category_name in DEFAULT_CATEGORIES:
      existing_category = session.exec(
        select(Category).where(Category.name == category_name)
      ).first()

      if not existing_category:
        category = Category(
          name=category_name,
          description=f"Default category for {category_name.lower()} expenses",
          is_default=True,
          is_active=True,
          user_id=None,
        )
        session.add(category)

    session.commit()

  assign_existing_expenses_to_first_user()


@app.on_event("startup")
def on_startup():
  create_db_and_tables()

# Auth Helper Functions

def verify_password(plain_password: str, hashed_password: str):
  return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str):
  return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
  to_encode = data.copy()

  if expires_delta:
    expire = datetime.now(timezone.utc) + expires_delta
  else:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)

  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

  return encoded_jwt


def get_user_by_username(username: str):
  with Session(engine) as session:
    user = session.exec(
      select(User).where(User.username == username)
    ).first()

    return user


def authenticate_user(username: str, password: str):
  user = get_user_by_username(username)

  if not user:
    return False

  if not verify_password(password, user.hashed_password):
    return False

  return user


def get_current_user(token: str = Depends(oauth2_scheme)):
  credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
  )

  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    username: str = payload.get("sub")

    if username is None:
      raise credentials_exception
  except JWTError:
    raise credentials_exception

  user = get_user_by_username(username)

  if user is None:
    raise credentials_exception

  return user


@app.get("/")
def read_root():
  return {"message": "Expense Tracker API is running"}



# User/Auth APIs

@app.post("/register", response_model=UserRead)
def register_user(user_data: UserCreate):
  username = user_data.username.strip()
  email = user_data.email.strip().lower()
  password = user_data.password

  if not username or not email or not password:
    raise HTTPException(
      status_code=400,
      detail="Username, email, and password are required"
    )

  if len(password) < 6:
    raise HTTPException(
      status_code=400,
      detail="Password must be at least 6 characters"
    )

  with Session(engine) as session:
    existing_username = session.exec(
      select(User).where(User.username == username)
    ).first()

    if existing_username:
      raise HTTPException(status_code=400, detail="Username already exists")

    existing_email = session.exec(
      select(User).where(User.email == email)
    ).first()

    if existing_email:
      raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
      username=username,
      email=email,
      hashed_password=get_password_hash(password),
      role="user",
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
  user = authenticate_user(form_data.username, form_data.password)

  if not user:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Incorrect username or password",
      headers={"WWW-Authenticate": "Bearer"},
    )

  access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(
    data={"sub": user.username, "role": user.role},
    expires_delta=access_token_expires,
  )

  return {
    "access_token": access_token,
    "token_type": "bearer",
    "username": user.username,
    "email": user.email,
    "role": user.role,
  }


@app.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
  return current_user

# Category APIs

@app.get("/categories", response_model=List[Category])
def get_categories(current_user: User = Depends(get_current_user)):
  with Session(engine) as session:
    categories = session.exec(
      select(Category).where(
        Category.is_active == True,
        (Category.is_default == True) | (Category.user_id == current_user.id)
      )
    ).all()

    return categories


@app.post("/categories", response_model=Category)
def create_category(
  category_data: CategoryCreate,
  current_user: User = Depends(get_current_user)
):
  category_name = category_data.name.strip()

  if not category_name:
    raise HTTPException(status_code=400, detail="Category name is required")

  with Session(engine) as session:
    existing_default_category = session.exec(
      select(Category).where(
        Category.name == category_name,
        Category.is_default == True
      )
    ).first()

    if existing_default_category:
      raise HTTPException(
        status_code=400,
        detail="This category already exists as a default category"
      )

    existing_user_category = session.exec(
      select(Category).where(
        Category.name == category_name,
        Category.user_id == current_user.id
      )
    ).first()

    if existing_user_category and existing_user_category.is_active:
      raise HTTPException(status_code=400, detail="Category already exists")

    if existing_user_category and not existing_user_category.is_active:
      existing_user_category.is_active = True
      existing_user_category.description = category_data.description.strip()
      session.add(existing_user_category)
      session.commit()
      session.refresh(existing_user_category)
      return existing_user_category

    category = Category(
      name=category_name,
      description=category_data.description.strip(),
      is_default=False,
      is_active=True,
      user_id=current_user.id,
    )

    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@app.delete("/categories/{category_id}")
def deactivate_category(
  category_id: int,
  current_user: User = Depends(get_current_user)
):
  with Session(engine) as session:
    category = session.get(Category, category_id)

    if not category:
      raise HTTPException(status_code=404, detail="Category not found")

    if category.is_default:
      raise HTTPException(
        status_code=400,
        detail="Default categories cannot be deleted"
      )

    if category.user_id != current_user.id:
      raise HTTPException(status_code=404, detail="Category not found")

    category.is_active = False
    session.add(category)
    session.commit()

    return {"message": "Category deactivated successfully"}


# Expense API

@app.get("/expenses", response_model=List[Expense])
def get_expenses(current_user: User = Depends(get_current_user)):
  with Session(engine) as session:
    expenses = session.exec(
      select(Expense).where(Expense.user_id == current_user.id)
    ).all()
    return expenses


@app.post("/expenses", response_model=Expense)
def create_expense(
  expense_data: ExpenseCreate,
  current_user: User = Depends(get_current_user)
):
  expense = Expense(
    **expense_data.model_dump(),
    user_id=current_user.id,
  )

  with Session(engine) as session:
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@app.put("/expenses/{expense_id}", response_model=Expense)
def update_expense(
  expense_id: int,
  updated_data: ExpenseUpdate,
  current_user: User = Depends(get_current_user)
):
  with Session(engine) as session:
    expense = session.get(Expense, expense_id)

    if not expense or expense.user_id != current_user.id:
      raise HTTPException(status_code=404, detail="Expense not found")

    expense.title = updated_data.title
    expense.category = updated_data.category
    expense.amount = updated_data.amount
    expense.date = updated_data.date
    expense.note = updated_data.note

    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@app.delete("/expenses/{expense_id}")
def delete_expense(
  expense_id: int,
  current_user: User = Depends(get_current_user)
):
  with Session(engine) as session:
    expense = session.get(Expense, expense_id)

    if not expense or expense.user_id != current_user.id:
      raise HTTPException(status_code=404, detail="Expense not found")

    session.delete(expense)
    session.commit()
    return {"message": "Expense deleted successfully"}