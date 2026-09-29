from pydantic import BaseModel


class AddressSuggestion(BaseModel):
    value: str
    city: str | None = None
    region: str | None = None
    street: str | None = None
    house: str | None = None
    lat: float | None = None
    lon: float | None = None
