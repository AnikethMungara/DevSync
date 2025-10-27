# === TEMPLATE FILE ===
# SAFE TO EDIT
# Purpose: Provide an example API route to confirm linkage.

from fastapi import APIRouter

router = APIRouter(prefix="/example", tags=["Example"])

@router.get("/")
def example_route():
    return {"message": "Example route connected successfully."}
