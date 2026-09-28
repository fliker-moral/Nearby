from pydantic import BaseModel, Field


class NotificationSubscriptionCreate(BaseModel):
    city: str = Field(min_length=1, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    enabled: bool = True


class NotificationSubscriptionRead(NotificationSubscriptionCreate):
    id: str
