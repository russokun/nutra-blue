import os
import uuid
import logging
from typing import Optional
from app.core.config import settings
from app.database.supabase import supabase_client

logger = logging.getLogger(__name__)

def upload_image(file_bytes: bytes, filename: str, content_type: Optional[str] = None) -> str:
    """
    Sube una imagen de producto utilizando la estrategia más óptima disponible:
    1. Cloudflare R2 (si R2_ACCOUNT_ID, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY están configurados)
    2. Supabase Storage (si Supabase está configurado)
    3. Almacenamiento local / Data URL (Fallback de desarrollo local)
    """
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    unique_filename = f"products/{uuid.uuid4()}{ext}"
    if not content_type:
        content_type = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"

    # 1. Intentar subir a Cloudflare R2 (vía boto3 compatible con S3)
    if settings.r2_account_id and settings.r2_access_key_id and settings.r2_secret_access_key:
        try:
            import boto3

            s3_client = boto3.client(
                service_name="s3",
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                region_name="auto"
            )

            s3_client.put_object(
                Bucket=settings.r2_bucket_name,
                Key=unique_filename,
                Body=file_bytes,
                ContentType=content_type
            )

            if settings.r2_public_domain:
                public_url = f"{settings.r2_public_domain.rstrip('/')}/{unique_filename}"
            else:
                public_url = f"https://{settings.r2_bucket_name}.{settings.r2_account_id}.r2.cloudflarestorage.com/{unique_filename}"

            logger.info("Imagen subida exitosamente a Cloudflare R2: %s", public_url)
            return public_url
        except Exception as e:
            logger.error("Error al subir a Cloudflare R2: %s. Reintentando con fallback...", str(e))

    # 2. Fallback a Supabase Storage
    if supabase_client is not None:
        try:
            bucket_name = "product-images"
            supabase_client.storage.from_(bucket_name).upload(
                file=file_bytes,
                path=unique_filename,
                file_options={"content-type": content_type}
            )
            public_url = supabase_client.storage.from_(bucket_name).get_public_url(unique_filename)
            logger.info("Imagen subida a Supabase Storage: %s", public_url)
            return public_url
        except Exception as e:
            logger.error("Error al subir a Supabase Storage: %s. Usando fallback local...", str(e))

    # 3. Fallback Local para desarrollo
    try:
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        local_path = os.path.join(upload_dir, os.path.basename(unique_filename))
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        
        # URL accesible localmente
        local_url = f"/uploads/{os.path.basename(unique_filename)}"
        logger.info("Imagen guardada localmente: %s", local_url)
        return local_url
    except Exception as e:
        logger.error("Error guardando imagen localmente: %s", str(e))
        # Si todo falla, retornar data URL base64 para no romper la experiencia
        import base64
        b64_str = base64.b64encode(file_bytes).decode("utf-8")
        return f"data:{content_type};base64,{b64_str}"
