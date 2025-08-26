# backend/config/settings.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str
    frontend_url: str

    class Config:
        env_file = ".env"
        
settings = Settings()
