import httpx
from fastapi import APIRouter, Query

from app.api.dependencies import CurrentUserDep
from app.core.config import settings
from app.core.errors import APIError
from app.schemas.address import AddressSuggestion

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("/suggest", response_model=list[AddressSuggestion])
async def suggest_addresses(
    _user: CurrentUserDep,
    query: str = Query(min_length=2, max_length=255),
    city: str = Query(default="Москва", min_length=1, max_length=120),
) -> list[AddressSuggestion]:
    if not settings.dadata_api_key or not settings.dadata_secret_key:
        raise APIError(503, "ADDRESS_SEARCH_NOT_CONFIGURED", "DaData is not configured")

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
                headers={
                    "Authorization": f"Token {settings.dadata_api_key}",
                    "X-Secret": settings.dadata_secret_key,
                    "Content-Type": "application/json",
                },
                json={"query": query, "count": 8, "locations": [{"city": city}]},
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise APIError(502, "ADDRESS_SEARCH_FAILED", "DaData address search failed") from exc

    result: list[AddressSuggestion] = []
    for item in response.json().get("suggestions", []):
        data = item.get("data") or {}
        result.append(
            AddressSuggestion(
                value=item.get("value", ""),
                city=data.get("city"),
                region=data.get("region"),
                street=data.get("street"),
                house=data.get("house"),
                lat=float(data["geo_lat"]) if data.get("geo_lat") else None,
                lon=float(data["geo_lon"]) if data.get("geo_lon") else None,
            )
        )
    return result
