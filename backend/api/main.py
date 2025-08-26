# backend/api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.services.assignment import get_all_assignments_service
from config.settings import settings
from api.services.data_test import get_test_data_service

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test")
async def get_test_data():
    return await get_test_data_service()

@app.get("/assignments")
async def get_all_assignments():
    return await get_all_assignments_service()