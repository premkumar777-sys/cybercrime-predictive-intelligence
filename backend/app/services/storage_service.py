import os
import uuid
from supabase import create_client, Client
from fastapi import UploadFile, HTTPException

# Maximum file size (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

# Allowed content types mapped to magic numbers
ALLOWED_MIME_TYPES = {
    "application/pdf": [b"%PDF-"],
    "image/jpeg": [b"\xFF\xD8\xFF"],
    "image/png": [b"\x89PNG\r\n\x1a\n"]
}

class StorageService:
    def __init__(self):
        self.url: str = os.environ.get("SUPABASE_URL", "")
        self.key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        self.bucket_name = "evidence"
        self.is_mock = not self.url or not self.key
        self.client: Client = create_client(self.url, self.key) if not self.is_mock else None

    def _verify_magic_number(self, file_content: bytes, declared_mime: str) -> bool:
        """Validates the actual file bytes against known magic numbers."""
        expected_signatures = ALLOWED_MIME_TYPES.get(declared_mime)
        if not expected_signatures:
            return False
            
        for signature in expected_signatures:
            if file_content.startswith(signature):
                return True
        return False

    async def upload_evidence(self, case_id: str, file: UploadFile) -> dict:
        # Read file contents
        content = await file.read()
        file_size = len(content)
        
        # 1. Size Validation
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File too large. Max size is {MAX_FILE_SIZE/1024/1024}MB.")
            
        # 2. Type Validation (MIME & Magic Number)
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=415, detail=f"File type {file.content_type} not allowed.")
            
        if not self._verify_magic_number(content, file.content_type):
            raise HTTPException(status_code=415, detail="File signature does not match declared content type (Spoofing detected).")
            
        # 3. Path Generation (No path traversal)
        evidence_id = str(uuid.uuid4())
        safe_ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        # Prevent traversal by using generated UUID for name
        safe_filename = f"{evidence_id}.{safe_ext}"
        storage_path = f"{case_id}/{safe_filename}"
        
        # 4. Upload to Supabase Storage
        if not self.is_mock:
            try:
                res = self.client.storage.from_(self.bucket_name).upload(
                    storage_path, 
                    content,
                    file_options={"content-type": file.content_type}
                )
            except Exception as e:
                # If bucket doesn't exist or permissions fail, etc.
                raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

        return {
            "evidence_id": evidence_id,
            "original_filename": file.filename,
            "storage_path": storage_path,
            "content_type": file.content_type,
            "file_size": file_size
        }
        
    def get_signed_url(self, storage_path: str, expires_in: int = 60) -> str:
        """Generate a short-lived download URL."""
        if self.is_mock:
            return f"https://mock-supabase.local/storage/v1/object/sign/evidence/{storage_path}?token=mock"
            
        try:
            res = self.client.storage.from_(self.bucket_name).create_signed_url(storage_path, expires_in)
            # The python client returns a dict with 'signedURL' or 'error' sometimes depending on version, 
            # or a URL string. 
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            elif isinstance(res, str):
                return res
            return ""
        except Exception:
            return ""

    def delete_evidence(self, storage_path: str):
        """Delete an object from Supabase Storage during rollback."""
        if self.is_mock:
            # Just pretend we deleted it
            return True
            
        try:
            self.client.storage.from_(self.bucket_name).remove([storage_path])
            return True
        except Exception as e:
            raise Exception(f"Failed to delete {storage_path} from Supabase: {str(e)}")
