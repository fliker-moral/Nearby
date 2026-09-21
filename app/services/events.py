from typing import Any, Protocol


class EventPublisher(Protocol):
    async def publish(self, event: str, data: dict[str, Any]) -> None: ...


class NoOpEventPublisher:
    async def publish(self, event: str, data: dict[str, Any]) -> None:
        del event, data


event_publisher = NoOpEventPublisher()
