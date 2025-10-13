from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import json
import os
from jose import JWTError, jwt
import uuid

app = FastAPI(title="Cc Calendar API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/cc_calendar")
client = AsyncIOMotorClient(MONGO_URL)
db = client.cc_calendar

# JWT settings
JWT_SECRET = os.environ.get("JWT_SECRET", "cc_calendar_jwt_secret_key_2024")
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Load persona templates
with open('/app/assets/persona_templates.json', 'r') as f:
    PERSONA_TEMPLATES = json.load(f)

# Pydantic models
class UserEvent(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    event_type: str  # cafe, restaurant, cultural, festival, etc.
    location: str
    city: str
    date: Optional[str] = None
    rating: Optional[float] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class EventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str  # cafe, restaurant, cultural, festival, etc.
    location: str
    city: str
    date: Optional[str] = None
    rating: Optional[float] = None

class UserProfile(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    timezone: str
    city: Optional[str] = None
    country: Optional[str] = None
    personality_type: str
    selected_persona: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    trial_started: Optional[datetime] = Field(default_factory=datetime.utcnow)
    subscription_active: bool = False
    subscription_expires: Optional[datetime] = None

class CityUpdate(BaseModel):
    city: str
    country: str
    timezone: str


class Task(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    date: datetime
    time: Optional[str] = None
    task_type: str = "general"
    priority: str = "medium"
    completed: bool = False
    deadline: Optional[datetime] = None
    reminder: Optional[datetime] = None
    timer_duration: Optional[str] = None
    repeat: str = "none"
    tags: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    all_day: bool = False
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class DayPlan(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: datetime
    tasks: List[dict]
    timeline: List[dict]
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class OnboardingRequest(BaseModel):
    name: str
    timezone: str
    city: Optional[str] = None
    country: Optional[str] = None
    personality_type: str
    selected_persona: str

class TaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    time: Optional[str] = None
    task_type: str = "general"
    priority: str = "medium"
    deadline: Optional[str] = None
    reminder: Optional[str] = None
    timer_duration: Optional[str] = None
    repeat: str = "none"
    tags: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    all_day: bool = False

class PersonaMessage(BaseModel):
    message_type: str
    persona: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Helper functions
def create_access_token(user_id: str):
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode = {"user_id": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_trial_status(user: dict):
    trial_started = user.get('trial_started')
    subscription_active = user.get('subscription_active', False)
    
    if subscription_active:
        return {"trial_active": False, "subscription_active": True, "days_left": 0}
    
    if trial_started:
        days_passed = (datetime.utcnow() - trial_started).days
        days_left = max(0, 3 - days_passed)
        trial_active = days_left > 0
        
        return {
            "trial_active": trial_active,
            "subscription_active": False,
            "days_left": days_left
        }
    
    return {"trial_active": False, "subscription_active": False, "days_left": 0}

def get_persona_message(message_type: str, persona: str):
    if message_type in PERSONA_TEMPLATES and persona in PERSONA_TEMPLATES[message_type]:
        return PERSONA_TEMPLATES[message_type][persona]
    return "Hello! Time for your scheduled activity."

def generate_day_timeline(tasks: List[dict]):
    # Simple rule-based ordering: morning -> work -> evening
    morning_tasks = []
    work_tasks = []
    evening_tasks = []
    
    for task in tasks:
        task_type = task.get('task_type', 'general')
        time_str = task.get('time', '')
        
        if task_type in ['exercise', 'meal'] or (time_str and time_str < '12:00'):
            morning_tasks.append(task)
        elif task_type in ['work', 'meeting'] or (time_str and '09:00' <= time_str <= '17:00'):
            work_tasks.append(task)
        else:
            evening_tasks.append(task)
    
    # Sort each category by time
    for task_list in [morning_tasks, work_tasks, evening_tasks]:
        task_list.sort(key=lambda x: x.get('time', '00:00'))
    
    timeline = []
    timeline.extend(morning_tasks)
    timeline.extend(work_tasks)
    timeline.extend(evening_tasks)
    
    return timeline

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Cc Calendar API"}

@app.post("/api/onboarding")
async def onboard_user(request: OnboardingRequest):
    user_data = UserProfile(**request.dict())
    
    # Check if user already exists (by name for now - in production use email)
    existing_user = await db.users.find_one({"name": request.name})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Insert user
    await db.users.insert_one(user_data.dict())
    
    # Create access token
    token = create_access_token(user_data.id)
    
    return {
        "token": token,
        "user": user_data.dict(),
        "message": get_persona_message("morning_plan", request.selected_persona)
    }

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    trial_status = check_trial_status(current_user)
    
    return {
        "user": current_user,
        "trial_status": trial_status
    }

@app.put("/api/user/persona")
async def update_persona(persona: str, current_user: dict = Depends(get_current_user)):
    valid_personas = ["casualBuddy", "caringSibling", "goodParent", "strictProfessional", "wildCard"]
    
    if persona not in valid_personas:
        raise HTTPException(status_code=400, detail="Invalid persona")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"selected_persona": persona}}
    )
    
    return {
        "message": "Persona updated successfully",
        "welcome_message": get_persona_message("morning_plan", persona)
    }

@app.post("/api/tasks")
async def create_task(request: TaskRequest, current_user: dict = Depends(get_current_user)):
    trial_status = check_trial_status(current_user)
    if not trial_status["trial_active"] and not trial_status["subscription_active"]:
        raise HTTPException(status_code=402, detail="Trial expired. Please subscribe to continue.")
    
    # Parse dates
    task_date = datetime.fromisoformat(request.date.replace('Z', '+00:00'))
    deadline = None
    reminder = None
    
    if request.deadline:
        deadline = datetime.fromisoformat(request.deadline.replace('Z', '+00:00'))
    if request.reminder:
        reminder = datetime.fromisoformat(request.reminder.replace('Z', '+00:00'))
    
    task_data = Task(
        user_id=current_user["id"],
        title=request.title,
        description=request.description,
        date=task_date,
        time=request.time,
        task_type=request.task_type,
        priority=request.priority,
        deadline=deadline,
        reminder=reminder,
        timer_duration=request.timer_duration,
        repeat=request.repeat,
        tags=request.tags,
        location=request.location,
        notes=request.notes,
        all_day=request.all_day
    )
    
    await db.tasks.insert_one(task_data.dict())
    
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message("reminder_task", persona)
    
    return {
        "task": task_data.dict(),
        "message": message
    }

@app.get("/api/tasks")
async def get_tasks(
    date: Optional[str] = None, 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    
    if date:
        target_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        start_date_dt = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_dt = start_date_dt + timedelta(days=1)
        query["date"] = {"$gte": start_date_dt, "$lt": end_date_dt}
    elif start_date and end_date:
        start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query["date"] = {"$gte": start_date_dt, "$lte": end_date_dt}
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(200)
    return {"tasks": tasks}

@app.put("/api/tasks/{task_id}")
async def update_task(
    task_id: str, 
    request: TaskRequest, 
    current_user: dict = Depends(get_current_user)
):
    trial_status = check_trial_status(current_user)
    if not trial_status["trial_active"] and not trial_status["subscription_active"]:
        raise HTTPException(status_code=402, detail="Trial expired. Please subscribe to continue.")
    
    # Parse dates
    task_date = datetime.fromisoformat(request.date.replace('Z', '+00:00'))
    deadline = None
    reminder = None
    
    if request.deadline:
        deadline = datetime.fromisoformat(request.deadline.replace('Z', '+00:00'))
    if request.reminder:
        reminder = datetime.fromisoformat(request.reminder.replace('Z', '+00:00'))
    
    update_data = {
        "title": request.title,
        "description": request.description,
        "date": task_date,
        "time": request.time,
        "task_type": request.task_type,
        "priority": request.priority,
        "deadline": deadline,
        "reminder": reminder,
        "timer_duration": request.timer_duration,
        "repeat": request.repeat,
        "tags": request.tags,
        "location": request.location,
        "notes": request.notes,
        "all_day": request.all_day
    }
    
    result = await db.tasks.update_one(
        {"id": task_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message("reminder_task", persona)
    
    return {"message": "Task updated successfully", "persona_message": message}

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

@app.get("/api/recommendations/holidays")
async def get_holidays(date: str, current_user: dict = Depends(get_current_user)):
    # Mock holiday data - in production, integrate with holiday APIs
    current_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
    current_month = current_date.month
    current_year = current_date.year
    
    holidays = []
    
    # Add some sample holidays based on the month
    holiday_data = {
        1: [
            {"name": "New Year's Day", "date": f"{current_year}-01-01", "type": "holiday"},
            {"name": "Martin Luther King Jr. Day", "date": f"{current_year}-01-15", "type": "holiday"}
        ],
        2: [
            {"name": "Valentine's Day", "date": f"{current_year}-02-14", "type": "celebration"},
            {"name": "Presidents Day", "date": f"{current_year}-02-19", "type": "holiday"}
        ],
        12: [
            {"name": "Christmas Day", "date": f"{current_year}-12-25", "type": "holiday"},
            {"name": "New Year's Eve", "date": f"{current_year}-12-31", "type": "celebration"}
        ]
    }
    
    if current_month in holiday_data:
        holidays = holiday_data[current_month]
    
    return {"holidays": holidays}

@app.post("/api/plan-day")
async def plan_my_day(date: str, current_user: dict = Depends(get_current_user)):
    trial_status = check_trial_status(current_user)
    if not trial_status["trial_active"] and not trial_status["subscription_active"]:
        raise HTTPException(status_code=402, detail="Trial expired. Please subscribe to continue.")
    
    # Get tasks for the date
    target_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
    start_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=1)
    
    tasks = await db.tasks.find({
        "user_id": current_user["id"],
        "date": {"$gte": start_date, "$lt": end_date},
        "completed": False
    }).to_list(100)
    
    # Generate timeline
    timeline = generate_day_timeline(tasks)
    
    # Save day plan
    day_plan = DayPlan(
        user_id=current_user["id"],
        date=target_date,
        tasks=tasks,
        timeline=timeline
    )
    
    await db.day_plans.insert_one(day_plan.dict())
    
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message("morning_plan", persona)
    
    return {
        "timeline": timeline,
        "message": message,
        "total_tasks": len(tasks)
    }

@app.get("/api/persona-message/{message_type}")
async def get_persona_message_api(message_type: str, current_user: dict = Depends(get_current_user)):
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message(message_type, persona)
    
    return {
        "message": message,
        "persona": persona,
        "timestamp": datetime.utcnow()
    }

# User Events - Manual Entry
@app.post("/api/events")
async def create_event(event: UserEvent, current_user: dict = Depends(get_current_user)):
    """Create a custom event/place for the user"""
    event_dict = event.dict()
    event_dict["user_id"] = current_user["id"]
    
    if isinstance(event_dict.get('created_at'), datetime):
        event_dict['created_at'] = event_dict['created_at'].isoformat()
    
    await db.events.insert_one(event_dict)
    
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message("explore_event", persona)
    
    return {
        "event": event_dict,
        "message": message
    }

@app.get("/api/events")
async def get_user_events(city: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all events for the current user, optionally filtered by city"""
    query = {"user_id": current_user["id"]}
    
    if city:
        query["city"] = city
    
    events = await db.events.find(query, {"_id": 0}).to_list(100)
    
    # Get default cultural events for the user's city
    user_city = city or current_user.get("city", "")
    default_events = get_default_cultural_events(user_city)
    
    # Combine user events with default events
    all_events = events + default_events
    
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message("explore_event", persona)
    
    return {
        "events": all_events,
        "message": message
    }

@app.put("/api/events/{event_id}")
async def update_event(event_id: str, event: UserEvent, current_user: dict = Depends(get_current_user)):
    """Update an existing event"""
    event_dict = event.dict()
    event_dict["user_id"] = current_user["id"]
    
    if isinstance(event_dict.get('created_at'), datetime):
        event_dict['created_at'] = event_dict['created_at'].isoformat()
    
    result = await db.events.update_one(
        {"id": event_id, "user_id": current_user["id"]},
        {"$set": event_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event updated successfully"}

@app.delete("/api/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an event"""
    result = await db.events.delete_one({"id": event_id, "user_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event deleted successfully"}

def get_default_cultural_events(city: str):
    """Return default cultural events based on city"""
    # Common events that exist in most cities
    common_events = [
        {
            "id": "default_1",
            "title": "Local Art Exhibition",
            "description": "Discover local artists and their work",
            "event_type": "cultural",
            "location": "City Art Gallery",
            "city": city,
            "date": "Ongoing",
            "is_default": True
        },
        {
            "id": "default_2",
            "title": "Food Festival",
            "description": "Experience local and international cuisines",
            "event_type": "festival",
            "location": "Central Park",
            "city": city,
            "date": "Weekends",
            "is_default": True
        },
        {
            "id": "default_3",
            "title": "Community Library",
            "description": "Free books, quiet reading space, and events",
            "event_type": "cultural",
            "location": "Main Street",
            "city": city,
            "date": "Daily",
            "is_default": True
        }
    ]
    
    return common_events

# City Update Endpoint
@app.put("/api/user/city")
async def update_user_city(city_data: CityUpdate, current_user: dict = Depends(get_current_user)):
    """Update user's city, country, and timezone"""
    result = await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "city": city_data.city,
            "country": city_data.country,
            "timezone": f"{city_data.city}, {city_data.country} ({city_data.timezone})"
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "message": "City updated successfully",
        "city": city_data.city,
        "country": city_data.country,
        "timezone": city_data.timezone
    }

@app.get("/api/explore/nearby")
async def get_nearby_places(current_user: dict = Depends(get_current_user)):
    """Get nearby places/events - now uses manual entries instead of Google Maps"""
    user_city = current_user.get("city", "Your City")
    
    # Get user's custom events
    events = await db.events.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    # Get default events for the city
    default_events = get_default_cultural_events(user_city)
    
    # Combine and return
    all_events = events + default_events
    
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message("explore_event", persona)
    
    return {
        "events": all_events,
        "city": user_city,
        "message": message
    }

@app.post("/api/payment/subscribe")
async def process_subscription(payment_data: dict, current_user: dict = Depends(get_current_user)):
    # This will be implemented with PayPal API
    # For now, simulate successful payment
    
    plan = payment_data.get("plan", "monthly")
    
    if plan == "monthly":
        expires = datetime.utcnow() + timedelta(days=30)
    else:  # annual
        expires = datetime.utcnow() + timedelta(days=365)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "subscription_active": True,
                "subscription_expires": expires,
                "subscription_plan": plan
            }
        }
    )
    
    return {
        "success": True,
        "message": "Subscription activated successfully",
        "expires": expires
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)