from datetime import date, datetime, time, timedelta, timezone
from math import ceil
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, distinct, func, or_, case
from sqlalchemy.orm import Session

from app.core.admin_auth import require_admin
from app.db.models import (
    ChatRequest,
    ErrorLog,
    FrontendMetric,
    RetrievalLog,
)
from app.db.session import get_db

router = APIRouter(
    prefix="/admin/api",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)

DETROIT_TIMEZONE = ZoneInfo("America/Detroit")

ConversationSortField = Literal[
    "timestamp",
    "visitor_id",
    "conversation_id",
    "question",
    "response_length",
    "status",
    "latency",
]

SortDirection = Literal["asc", "desc"]

ConversationStatusFilter = Literal[
    "success",
    "failed",
    "cancelled",
]

ConversationStreamingFilter = Literal[
    "streaming",
    "non_streaming",
]

AnalyticsRange = Literal["7d", "30d", "90d", "all"]

RANGE_DAYS: dict[str, int] = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
}


def get_range_utc_bounds(
    selected_range: AnalyticsRange,
) -> tuple[datetime | None, datetime]:
    """
    Return UTC bounds for a Detroit-local analytics range.

    The start is inclusive and the end is exclusive.
    Seven days includes today and the previous six days.
    """

    today_detroit = datetime.now(DETROIT_TIMEZONE).date()

    tomorrow_start_detroit = datetime.combine(
        today_detroit + timedelta(days=1),
        time.min,
        tzinfo=DETROIT_TIMEZONE,
    )

    end_utc = tomorrow_start_detroit.astimezone(timezone.utc)

    if selected_range == "all":
        return None, end_utc

    start_date = today_detroit - timedelta(
        days=RANGE_DAYS[selected_range] - 1
    )

    start_detroit = datetime.combine(
        start_date,
        time.min,
        tzinfo=DETROIT_TIMEZONE,
    )

    return start_detroit.astimezone(timezone.utc), end_utc


def detroit_date_bucket(column):
    """
    Convert a PostgreSQL timezone-aware timestamp into a Detroit-local date.
    """

    return func.date(
        func.timezone("America/Detroit", column)
    )


def rounded_average(value: float | None) -> float | None:
    if value is None:
        return None

    return round(float(value), 2)


def get_today_utc_bounds() -> tuple[datetime, datetime]:
    """
    Return the UTC range corresponding to today's date in Detroit.

    The start is inclusive and the end is exclusive.
    """

    now_detroit = datetime.now(DETROIT_TIMEZONE)

    today_start_detroit = datetime.combine(
        now_detroit.date(),
        time.min,
        tzinfo=DETROIT_TIMEZONE,
    )

    tomorrow_start_detroit = today_start_detroit + timedelta(days=1)

    return (
        today_start_detroit.astimezone(timezone.utc),
        tomorrow_start_detroit.astimezone(timezone.utc),
    )


@router.get("")
def admin_api_status() -> dict:
    return {
        "status": "ok",
        "service": "admin-analytics-api",
    }


@router.get("/summary")
def get_admin_summary(
    db: Session = Depends(get_db),
) -> dict:
    today_start, today_end = get_today_utc_bounds()

    total_conversations = (
        db.query(
            func.count(
                distinct(ChatRequest.conversation_id)
            )
        )
        .filter(ChatRequest.conversation_id.isnot(None))
        .scalar()
        or 0
    )

    chats_today = (
        db.query(func.count(ChatRequest.id))
        .filter(
            ChatRequest.timestamp >= today_start,
            ChatRequest.timestamp < today_end,
        )
        .scalar()
        or 0
    )

    latency_averages = (
        db.query(
            func.avg(ChatRequest.total_latency_ms),
            func.avg(ChatRequest.retrieval_latency_ms),
            func.avg(ChatRequest.generation_latency_ms),
            func.avg(ChatRequest.backend_ttft_ms),
        )
        .one()
    )

    average_rerank_latency = (
        db.query(func.avg(RetrievalLog.rerank_duration_ms))
        .filter(RetrievalLog.rerank_duration_ms.isnot(None))
        .scalar()
    )

    average_frontend_ttft = (
        db.query(
            func.avg(FrontendMetric.time_to_first_token_ms)
        )
        .filter(
            FrontendMetric.event_name == "first_token_received",
            FrontendMetric.time_to_first_token_ms.isnot(None),
        )
        .scalar()
    )

    total_requests = (
        db.query(func.count(ChatRequest.id)).scalar() or 0
    )

    successful_requests = (
        db.query(func.count(ChatRequest.id))
        .filter(ChatRequest.status == "success")
        .scalar()
        or 0
    )

    success_rate = (
        round(
            successful_requests / total_requests * 100,
            2,
        )
        if total_requests
        else 0.0
    )

    error_count = (
        db.query(func.count(ErrorLog.id)).scalar() or 0
    )

    cancelled_streams = (
        db.query(func.count(ChatRequest.id))
        .filter(ChatRequest.stream_cancelled.is_(True))
        .scalar()
        or 0
    )

    return {
        "total_conversations": total_conversations,
        "total_chats": total_requests,
        "chats_today": chats_today,
        "average_response_latency_ms": rounded_average(
            latency_averages[0]
        ),
        "average_retrieval_latency_ms": rounded_average(
            latency_averages[1]
        ),
        "average_rerank_latency_ms": rounded_average(
            average_rerank_latency
        ),
        "average_generation_latency_ms": rounded_average(
            latency_averages[2]
        ),
        "average_backend_ttft_ms": rounded_average(
            latency_averages[3]
        ),
        "average_frontend_ttft_ms": rounded_average(
            average_frontend_ttft
        ),
        "success_rate": success_rate,
        "error_count": error_count,
        "cancelled_streams": cancelled_streams,
    }

@router.get("/trends")
def get_admin_trends(
    range: AnalyticsRange = Query(default="7d"),
    db: Session = Depends(get_db),
) -> dict:
    start_utc, end_utc = get_range_utc_bounds(range)

    # Main chat-request aggregates.
    chat_date = detroit_date_bucket(
        ChatRequest.timestamp
    ).label("date")

    chat_query = db.query(
        chat_date,
        func.count(ChatRequest.id).label("chats"),
        func.count(
            distinct(ChatRequest.conversation_id)
        ).label("conversations"),
        func.avg(
            ChatRequest.total_latency_ms
        ).label("average_total_latency_ms"),
        func.avg(
            ChatRequest.retrieval_latency_ms
        ).label("average_retrieval_latency_ms"),
        func.avg(
            ChatRequest.generation_latency_ms
        ).label("average_generation_latency_ms"),
        func.avg(
            ChatRequest.backend_ttft_ms
        ).label("average_backend_ttft_ms"),
        func.sum(
            case(
                (ChatRequest.status == "success", 1),
                else_=0,
            )
        ).label("successes"),
        func.sum(
            case(
                (ChatRequest.stream_cancelled.is_(True), 1),
                else_=0,
            )
        ).label("cancelled_streams"),
    ).filter(
        ChatRequest.timestamp < end_utc
    )

    if start_utc is not None:
        chat_query = chat_query.filter(
            ChatRequest.timestamp >= start_utc
        )

    chat_rows = (
        chat_query
        .group_by(chat_date)
        .order_by(chat_date)
        .all()
    )

    # Rerank timing is stored separately in retrieval_logs.
    # Group it by the original request date so all measurements line up.
    rerank_date = detroit_date_bucket(
        ChatRequest.timestamp
    ).label("date")

    rerank_query = (
        db.query(
            rerank_date,
            func.avg(
                RetrievalLog.rerank_duration_ms
            ).label("average_rerank_latency_ms"),
        )
        .join(
            RetrievalLog,
            RetrievalLog.request_id == ChatRequest.request_id,
        )
        .filter(
            ChatRequest.timestamp < end_utc,
            RetrievalLog.rerank_duration_ms.isnot(None),
        )
    )

    if start_utc is not None:
        rerank_query = rerank_query.filter(
            ChatRequest.timestamp >= start_utc
        )

    rerank_rows = (
        rerank_query
        .group_by(rerank_date)
        .order_by(rerank_date)
        .all()
    )

    # Reduce frontend metrics to one TTFT value per request before
    # calculating the daily average. This prevents duplicate events from
    # giving one request extra weight.
    frontend_ttft_per_request = (
        db.query(
            FrontendMetric.request_id.label("request_id"),
            func.avg(
                FrontendMetric.time_to_first_token_ms
            ).label("frontend_ttft_ms"),
        )
        .filter(
            FrontendMetric.request_id.isnot(None),
            FrontendMetric.event_name == "first_token_received",
            FrontendMetric.time_to_first_token_ms.isnot(None),
        )
        .group_by(FrontendMetric.request_id)
        .subquery()
    )

    frontend_date = detroit_date_bucket(
        ChatRequest.timestamp
    ).label("date")

    frontend_query = (
        db.query(
            frontend_date,
            func.avg(
                frontend_ttft_per_request.c.frontend_ttft_ms
            ).label("average_frontend_ttft_ms"),
        )
        .join(
            frontend_ttft_per_request,
            frontend_ttft_per_request.c.request_id
            == ChatRequest.request_id,
        )
        .filter(ChatRequest.timestamp < end_utc)
    )

    if start_utc is not None:
        frontend_query = frontend_query.filter(
            ChatRequest.timestamp >= start_utc
        )

    frontend_rows = (
        frontend_query
        .group_by(frontend_date)
        .order_by(frontend_date)
        .all()
    )

    # Error logs have their own timestamps and can exist independently
    # from a successfully recorded chat request.
    error_date = detroit_date_bucket(
        ErrorLog.timestamp
    ).label("date")

    error_query = (
        db.query(
            error_date,
            func.count(ErrorLog.id).label("errors"),
        )
        .filter(ErrorLog.timestamp < end_utc)
    )

    if start_utc is not None:
        error_query = error_query.filter(
            ErrorLog.timestamp >= start_utc
        )

    error_rows = (
        error_query
        .group_by(error_date)
        .order_by(error_date)
        .all()
    )

    chat_by_date = {
        row.date: {
            "chats": int(row.chats or 0),
            "conversations": int(row.conversations or 0),
            "average_total_latency_ms": rounded_average(
                row.average_total_latency_ms
            ),
            "average_retrieval_latency_ms": rounded_average(
                row.average_retrieval_latency_ms
            ),
            "average_generation_latency_ms": rounded_average(
                row.average_generation_latency_ms
            ),
            "average_backend_ttft_ms": rounded_average(
                row.average_backend_ttft_ms
            ),
            "successes": int(row.successes or 0),
            "cancelled_streams": int(
                row.cancelled_streams or 0
            ),
        }
        for row in chat_rows
    }

    rerank_by_date = {
        row.date: rounded_average(
            row.average_rerank_latency_ms
        )
        for row in rerank_rows
    }

    frontend_by_date = {
        row.date: rounded_average(
            row.average_frontend_ttft_ms
        )
        for row in frontend_rows
    }

    errors_by_date = {
        row.date: int(row.errors or 0)
        for row in error_rows
    }

    recorded_dates = (
        set(chat_by_date)
        | set(rerank_by_date)
        | set(frontend_by_date)
        | set(errors_by_date)
    )

    if not recorded_dates:
        return {
            "range": range,
            "items": [],
        }

    today_detroit = datetime.now(DETROIT_TIMEZONE).date()

    if range == "all":
        first_date = min(recorded_dates)
    else:
        first_date = today_detroit - timedelta(
            days=RANGE_DAYS[range] - 1
        )

    items = []
    current_date: date = first_date

    while current_date <= today_detroit:
        chat_metrics = chat_by_date.get(current_date, {})

        items.append(
            {
                "date": current_date.isoformat(),
                "chats": chat_metrics.get("chats", 0),
                "conversations": chat_metrics.get(
                    "conversations",
                    0,
                ),
                "average_total_latency_ms": chat_metrics.get(
                    "average_total_latency_ms"
                ),
                "average_retrieval_latency_ms": chat_metrics.get(
                    "average_retrieval_latency_ms"
                ),
                "average_rerank_latency_ms": rerank_by_date.get(
                    current_date
                ),
                "average_generation_latency_ms": chat_metrics.get(
                    "average_generation_latency_ms"
                ),
                "average_backend_ttft_ms": chat_metrics.get(
                    "average_backend_ttft_ms"
                ),
                "average_frontend_ttft_ms": frontend_by_date.get(
                    current_date
                ),
                "successes": chat_metrics.get("successes", 0),
                "errors": errors_by_date.get(current_date, 0),
                "cancelled_streams": chat_metrics.get(
                    "cancelled_streams",
                    0,
                ),
            }
        )

        current_date += timedelta(days=1)

    return {
        "range": range,
        "items": items,
    }

@router.get("/conversations")
def get_admin_conversations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    search: str | None = Query(default=None, max_length=300),
    status: ConversationStatusFilter | None = Query(
        default=None
    ),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    visitor_id: str | None = Query(
        default=None,
        max_length=100,
    ),
    conversation_id: str | None = Query(
        default=None,
        max_length=100,
    ),
    device: str | None = Query(
        default=None,
        max_length=100,
    ),
    browser: str | None = Query(
        default=None,
        max_length=100,
    ),
    streaming: ConversationStreamingFilter | None = Query(
        default=None
    ),
    sort_by: ConversationSortField = Query(
        default="timestamp"
    ),
    sort_direction: SortDirection = Query(default="desc"),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(ChatRequest)
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=422,
            detail="date_from cannot be later than date_to.",
        )

    if status == "success":
        query = query.filter(
            ChatRequest.status == "success",
            or_(
                ChatRequest.stream_cancelled.is_(False),
                ChatRequest.stream_cancelled.is_(None),
            ),
        )

    elif status == "failed":
        query = query.filter(
            ChatRequest.status.isnot(None),
            ChatRequest.status != "success",
            or_(
                ChatRequest.stream_cancelled.is_(False),
                ChatRequest.stream_cancelled.is_(None),
            ),
        )

    elif status == "cancelled":
        query = query.filter(
            ChatRequest.stream_cancelled.is_(True)
        )

    if date_from:
        start_detroit = datetime.combine(
            date_from,
            time.min,
            tzinfo=DETROIT_TIMEZONE,
        )

        query = query.filter(
            ChatRequest.timestamp
            >= start_detroit.astimezone(timezone.utc)
        )

    if date_to:
        end_detroit = datetime.combine(
            date_to + timedelta(days=1),
            time.min,
            tzinfo=DETROIT_TIMEZONE,
        )

        query = query.filter(
            ChatRequest.timestamp
            < end_detroit.astimezone(timezone.utc)
        )

    if visitor_id and visitor_id.strip():
        query = query.filter(
            ChatRequest.visitor_id == visitor_id.strip()
        )

    if conversation_id and conversation_id.strip():
        query = query.filter(
            ChatRequest.conversation_id
            == conversation_id.strip()
        )

    if device and device.strip():
        query = query.filter(
            func.lower(ChatRequest.device_type)
            == device.strip().lower()
        )

    if browser and browser.strip():
        query = query.filter(
            func.lower(ChatRequest.browser)
            == browser.strip().lower()
        )

    if streaming == "streaming":
        query = query.filter(
            ChatRequest.streaming_enabled.is_(True)
        )

    elif streaming == "non_streaming":
        query = query.filter(
            or_(
                ChatRequest.streaming_enabled.is_(False),
                ChatRequest.streaming_enabled.is_(None),
            )
        )

    if search and search.strip():
        search_term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                ChatRequest.user_query.ilike(search_term),
                ChatRequest.response_text.ilike(search_term),
                ChatRequest.visitor_id.ilike(search_term),
                ChatRequest.conversation_id.ilike(search_term),
                ChatRequest.message_id.ilike(search_term),
                ChatRequest.request_id.ilike(search_term),
                ChatRequest.browser.ilike(search_term),
                ChatRequest.device_type.ilike(search_term),
                ChatRequest.status.ilike(search_term),
            )
        )

    sort_columns = {
        "timestamp": ChatRequest.timestamp,
        "visitor_id": ChatRequest.visitor_id,
        "conversation_id": ChatRequest.conversation_id,
        "question": ChatRequest.user_query,
        "response_length": ChatRequest.response_length,
        "status": ChatRequest.status,
        "latency": ChatRequest.total_latency_ms,
    }

    sort_column = sort_columns[sort_by]
    sort_function = (
        desc if sort_direction == "desc" else asc
    )

    total_items = query.count()
    total_pages = (
        ceil(total_items / page_size)
        if total_items
        else 0
    )

    rows = (
        query.order_by(
            sort_function(sort_column),
            desc(ChatRequest.id),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = []

    for row in rows:
        response_text = row.response_text or ""

        items.append(
            {
                "request_id": row.request_id,
                "timestamp": row.timestamp,
                "visitor_id": row.visitor_id,
                "conversation_id": row.conversation_id,
                "message_id": row.message_id,
                "question": row.user_query,
                "response_preview": (
                    response_text[:250]
                    if response_text
                    else None
                ),
                "response_length": row.response_length,
                "status": row.status,
                "total_latency_ms": row.total_latency_ms,
                "browser": row.browser,
                "device": row.device_type,
                "streaming_enabled": row.streaming_enabled,
                "stream_cancelled": row.stream_cancelled,
            }
        )

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_previous": page > 1,
            "has_next": page < total_pages,
        },
        "sorting": {
            "sort_by": sort_by,
            "sort_direction": sort_direction,
        },
        "search": search,
        "filters": {
            "status": status,
            "date_from": (
                date_from.isoformat()
                if date_from
                else None
            ),
            "date_to": (
                date_to.isoformat()
                if date_to
                else None
            ),
            "visitor_id": visitor_id,
            "conversation_id": conversation_id,
            "device": device,
            "browser": browser,
            "streaming": streaming,
        },
    }


@router.get("/conversations/{request_id}")
def get_admin_conversation_details(
    request_id: str,
    db: Session = Depends(get_db),
) -> dict:
    chat_request = (
        db.query(ChatRequest)
        .filter(ChatRequest.request_id == request_id)
        .first()
    )

    if chat_request is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation request not found.",
        )

    retrieval_log = (
        db.query(RetrievalLog)
        .filter(RetrievalLog.request_id == request_id)
        .first()
    )

    frontend_metrics = (
        db.query(FrontendMetric)
        .filter(FrontendMetric.request_id == request_id)
        .order_by(FrontendMetric.timestamp.asc())
        .all()
    )

    error_logs = (
        db.query(ErrorLog)
        .filter(ErrorLog.request_id == request_id)
        .order_by(ErrorLog.timestamp.asc())
        .all()
    )

    frontend_ttft = next(
        (
            metric.time_to_first_token_ms
            for metric in frontend_metrics
            if metric.event_name == "first_token_received"
            and metric.time_to_first_token_ms is not None
        ),
        None,
    )

    stream_completion = next(
        (
            metric.stream_completion_ms
            for metric in reversed(frontend_metrics)
            if metric.stream_completion_ms is not None
        ),
        None,
    )

    return {
        "request": {
            "visitor_id": chat_request.visitor_id,
            "conversation_id": chat_request.conversation_id,
            "message_id": chat_request.message_id,
            "request_id": chat_request.request_id,
            "timestamp": chat_request.timestamp,
            "status": chat_request.status,
            "streaming_enabled": (
                chat_request.streaming_enabled
            ),
            "stream_cancelled": (
                chat_request.stream_cancelled
            ),
        },
        "prompt": {
            "user_question": chat_request.user_query,
        },
        "assistant": {
            "full_response": chat_request.response_text,
            "response_length": chat_request.response_length,
            "model_used": chat_request.model_used,
        },
        "retrieval": {
            "used_forced_context": (
                retrieval_log.used_forced_context
                if retrieval_log
                else False
            ),
            "project_query": (
                retrieval_log.project_query
                if retrieval_log
                else False
            ),
            "fallback_retrieval_used": (
                retrieval_log.fallback_retrieval_used
                if retrieval_log
                else False
            ),
            "reranking_enabled": (
                retrieval_log.reranking_enabled
                if retrieval_log
                else chat_request.reranking_enabled
            ),
            "retrieved_chunks": (
                retrieval_log.retrieved_chunk_data
                if retrieval_log
                else []
            ),
            "reranked_chunks": (
                retrieval_log.reranked_chunk_data
                if retrieval_log
                else []
            ),
            "source_files": (
                retrieval_log.chunk_sources
                if retrieval_log
                else []
            ),
            "retrieved_chunk_count": (
                retrieval_log.retrieved_chunks
                if retrieval_log
                else None
            ),
            "reranked_chunk_count": (
                retrieval_log.reranked_chunks
                if retrieval_log
                else None
            ),
        },
        "performance": {
            "backend": {
                "vector_retrieval_ms": (
                    retrieval_log.vector_retrieval_duration_ms
                    if retrieval_log
                    else None
                ),
                "fallback_retrieval_ms": (
                    retrieval_log.fallback_retrieval_duration_ms
                    if retrieval_log
                    else None
                ),
                "reranking_ms": (
                    retrieval_log.rerank_duration_ms
                    if retrieval_log
                    else None
                ),
                "retrieval_total_ms": (
                    retrieval_log.total_retrieval_duration_ms
                    if retrieval_log
                    else chat_request.retrieval_latency_ms
                ),
                "generation_ms": (
                    chat_request.generation_latency_ms
                ),
                "ttft_ms": chat_request.backend_ttft_ms,
                "total_latency_ms": (
                    chat_request.total_latency_ms
                ),
            },
            "frontend": {
                "frontend_ttft_ms": frontend_ttft,
                "stream_completion_ms": stream_completion,
                "events": [
                    {
                        "event_name": metric.event_name,
                        "timestamp": metric.timestamp,
                        "time_to_first_token_ms": (
                            metric.time_to_first_token_ms
                        ),
                        "time_to_first_response_ms": (
                            metric.time_to_first_response_ms
                        ),
                        "stream_completion_ms": (
                            metric.stream_completion_ms
                        ),
                    }
                    for metric in frontend_metrics
                ],
            },
        },
        "client": {
            "browser": chat_request.browser,
            "device": chat_request.device_type,
            "screen_width": chat_request.screen_width,
            "screen_height": chat_request.screen_height,
        },
        "errors": [
            {
                "type": error.error_type,
                "message": error.message,
                "endpoint": error.endpoint,
                "timestamp": error.timestamp,
            }
            for error in error_logs
        ],
    }