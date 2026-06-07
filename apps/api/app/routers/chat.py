import json
import uuid
import httpx
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form, Header
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.database.supabase import supabase_client
from app.core.config import settings

router = APIRouter(prefix="/integrated-ai", tags=["Chat"])

from app.core.mock_store import MOCK_CHAT_HISTORY

async def get_user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    if supabase_client is None:
        return "mock-user-id"
        
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    
    try:
        # If it's a legacy PocketBase base64 encoded token:
        # (For initial compatibility until the frontend auth is fully converted to Supabase)
        try:
            import base64
            decoded = base64.b64decode(token).decode("utf-8")
            token_data = json.loads(decoded)
            if "record" in token_data and "id" in token_data["record"]:
                return token_data["record"]["id"]
        except Exception:
            pass

        # Otherwise, verify as a native Supabase JWT token
        user_response = supabase_client.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user.id
    except Exception:
        pass
    
    return None

async def upload_image_to_supabase(file: UploadFile) -> str:
    if supabase_client is None:
        return f"https://example.com/mock-images/{file.filename}"

    bucket_name = "integrated-ai-images"
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    file_bytes = await file.read()
    
    try:
        # Create bucket if it doesn't exist (Supabase Storage)
        try:
            supabase_client.storage.create_bucket(bucket_name, options={"public": True})
        except Exception:
            pass # Bucket already exists
            
        # Upload file bytes to Supabase Storage
        supabase_client.storage.from_(bucket_name).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Retrieve public URL
        url_res = supabase_client.storage.from_(bucket_name).get_public_url(unique_filename)
        return url_res
    except Exception as e:
        raise Exception(f"Failed to upload image to Supabase: {str(e)}")

async def get_chat_history(user_id: str) -> List[dict]:
    if not user_id:
        return []
        
    if supabase_client is None:
        return MOCK_CHAT_HISTORY.get(user_id, [])

    try:
        response = supabase_client.from_("ai_messages") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at") \
            .execute()
            
        history = []
        for record in response.data:
            # Map Supabase records to AI proxy history format
            role = record.get("role")
            content = record.get("content") # content is JSONB
            
            # Map message blocks
            if role == "user":
                text_parts = [b.get("text") for b in content if b.get("type") == "text"]
                images = [b.get("image") for b in content if b.get("type") == "image"]
                msg = {
                    "role": "user",
                    "content": "\n".join(filter(None, text_parts))
                }
                if images:
                    msg["images"] = images
                history.append(msg)
            elif role == "assistant":
                # For assistant, rebuild the message structure
                text_parts = [b.get("text") for b in content if b.get("type") == "text"]
                history.append({
                    "role": "assistant",
                    "content": "\n".join(filter(None, text_parts))
                })
        return history
    except Exception:
        return []

@router.post("/stream")
async def stream_chat(
    request: Request,
    message: str = Form(...),
    images: Optional[List[UploadFile]] = File(None),
    authorization: Optional[str] = Header(None)
):
    user_id = await get_user_id_from_token(authorization)
    
    try:
        parsed_message = json.loads(message)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid message JSON format")

    # Upload files to Supabase and append to the message block
    if images:
        for file in images:
            if file.content_type in ["image/jpeg", "image/png", "image/webp"]:
                img_url = await upload_image_to_supabase(file)
                parsed_message.append({"type": "image", "image": img_url})

    # Retrieve prior conversation history
    history = await get_chat_history(user_id) if user_id else []

    # System prompt matching the e-commerce sales model
    from app.core.config import settings
    from app.core.constants_prompts import SystemPrompt

    # Build AI request payload
    ai_payload = {
        "website_id": settings.website_id,
        "history": history + [
            # Map user message
            {
                "role": "user",
                "content": "\n".join([b.get("text") for b in parsed_message if b.get("type") == "text"]),
                **( { "images": [b.get("image") for b in parsed_message if b.get("type") == "image"] } if any(b.get("type") == "image" for b in parsed_message) else {} )
            }
        ],
        "system_prompt": SystemPrompt,
        "stream": True,
        "environment": "dev"
    }

    async def event_generator():
        assistant_response_content = []
        
        # Check if AI credentials or supabase is missing -> triggers mock responder
        if supabase_client is None or not settings.integrated_ai_api_url or not settings.integrated_ai_api_key or "your-project" in settings.supabase_url:
            import asyncio
            user_text = "\n".join([b.get("text") for b in parsed_message if b.get("type") == "text"])
            user_text_lower = user_text.lower()
            
            # Simulated responses based on keywords
            if "calm" in user_text_lower or "focus" in user_text_lower:
                response_text = "¡Hola! Nuestro Calm & Focus es un adaptógeno natural excelente para mejorar la concentración y reducir la niebla mental. Cuesta $18,990 CLP. ¿Te gustaría saber cómo tomarlo o añadirlo al carrito?"
            elif "cacao" in user_text_lower or "chocolate" in user_text_lower:
                response_text = "El Dark Cacao de Nutra Blue es cacao ceremonial premium alto en polifenoles y un potente antioxidante. Ideal para la longevidad y energía vital, por solo $22,500 CLP."
            elif "matcha" in user_text_lower or "te" in user_text_lower or "té" in user_text_lower:
                response_text = "Matcha Ritual es té ceremonial premium orgánico. Aporta energía sostenida sin el crash de la cafeína gracias a la L-teanina. Cuesta $24,990 CLP."
            elif "precio" in user_text_lower or "cuanto" in user_text_lower or "cuánto" in user_text_lower or "valor" in user_text_lower:
                response_text = "Claro, nuestros suplementos premium de Nutra Blue van desde los $14,990 CLP (como Golden Turmeric) hasta los $24,990 CLP (Matcha Ritual). Todos son 100% orgánicos."
            elif "carrito" in user_text_lower or "comprar" in user_text_lower or "pagar" in user_text_lower:
                response_text = "Para comprar, simplemente añade los productos que desees al carrito en la pestaña 'Tienda' y luego dirígete al Checkout para completar tu pago seguro con Flow o Mercado Pago."
            else:
                response_text = "¡Hola! Bienvenido a Nutra Blue. Soy tu asistente de bienestar. Te puedo recomendar suplementos adaptógenos orgánicos como Calm & Focus, Dark Cacao, Matcha Ritual, Reishi Mushroom y más. ¿En qué te puedo ayudar hoy?"
                
            words = response_text.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'type': 'content', 'data': {'content': chunk}})}\n\n"
                assistant_response_content.append(chunk)
                await asyncio.sleep(0.04)
                
            # Log local history
            if user_id:
                if user_id not in MOCK_CHAT_HISTORY:
                    MOCK_CHAT_HISTORY[user_id] = []
                MOCK_CHAT_HISTORY[user_id].append({
                    "role": "user",
                    "content": parsed_message
                })
                MOCK_CHAT_HISTORY[user_id].append({
                    "role": "assistant",
                    "content": [{"type": "text", "text": "".join(assistant_response_content)}]
                })
                
            yield f"data: [DONE]\n\n"
            yield f"data: {json.dumps({'type': 'completed', 'data': {'content': '[COMPLETED]'}})}\n\n"
            return

        headers = {
            "Accept": "text/event-stream",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.integrated_ai_api_key}"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{settings.integrated_ai_api_url}/generate",
                    json=ai_payload,
                    headers=headers,
                    timeout=60.0
                ) as response:
                    
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'type': 'error', 'data': {'content': 'AI proxy request failed'}})}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        
                        yield f"{line}\n\n"
                        
                        # Accumulate assistant text for database log
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                event = json.loads(data_str)
                                if event.get("type") == "content":
                                    content_text = event.get("data", {}).get("content", "")
                                    assistant_response_content.append(content_text)
                            except Exception:
                                pass
            
            # Save User & Assistant conversation to Supabase once stream completes
            if user_id and supabase_client is not None:
                assistant_text = "".join(assistant_response_content)
                supabase_client.from_("ai_messages").insert([
                    {
                        "user_id": user_id,
                        "role": "user",
                        "content": parsed_message
                    },
                    {
                        "user_id": user_id,
                        "role": "assistant",
                        "content": [{"type": "text", "text": assistant_text}]
                    }
                ]).execute()
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'data': {'content': str(e)}})}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'completed', 'data': {'content': '[COMPLETED]'}})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
