# backend/api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.service.get_sales_assignment import get_sales_assignment
from api.schema.user_shema import CreateSalesUserRequest
from api.service.create_sales_user import create_sales_user
from api.service.delete_sales_user import delete_sales_user
from api.service.update_sales_user import update_sales_user
from config.settings import settings

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/sales_assignment")
async def getSalesAssignment():
    return await get_sales_assignment()

@app.post("/create_sales_user")
async def createSalesUser(user: CreateSalesUserRequest):
    return await create_sales_user(user)

@app.delete("/sales_user/{role}/{user_id}")
async def deleteSalesUser(role: str, user_id: int):
    return await delete_sales_user(role, user_id)

@app.put("/sales_user/{role}/{user_id}")
async def updateSalesUser(role: str, user_id: int, user: CreateSalesUserRequest):
    return await update_sales_user(role, user_id, user)