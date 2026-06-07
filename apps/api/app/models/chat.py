from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatMessageBlock(BaseModel):
    type: str # text, image
    text: Optional[str] = None
    image: Optional[str] = None

class ChatRequest(BaseModel):
    message: str # JSON serialized array of ChatMessageBlock
