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
class UserProfile(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    timezone: str
    personality_type: str
    selected_persona: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    trial_started: Optional[datetime] = Field(default_factory=datetime.utcnow)
    subscription_active: bool = False
    subscription_expires: Optional[datetime] = None

class Task(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    date: datetime
    time: Optional[str] = None
    task_type: str = "general"  # work, personal, exercise, meal, etc.
    completed: bool = False
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
    personality_type: str
    selected_persona: str

class TaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    time: Optional[str] = None
    task_type: str = "general"

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
        
        user = await db.users.find_one({"id": user_id})
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
    
    task_data = Task(
        user_id=current_user["id"],
        date=datetime.fromisoformat(request.date.replace('Z', '+00:00')),
        **{k: v for k, v in request.dict().items() if k != 'date'}
    )
    
    await db.tasks.insert_one(task_data.dict())
    
    persona = current_user.get("selected_persona", "casualBuddy")
    message = get_persona_message("reminder_task", persona)
    
    return {
        "task": task_data.dict(),
        "message": message
    }

@app.get("/api/tasks")
async def get_tasks(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    
    if date:
        target_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        start_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        query["date"] = {"$gte": start_date, "$lt": end_date}
    
    tasks = await db.tasks.find(query).to_list(100)
    return {"tasks": tasks}

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

@app.get("/api/explore/nearby")
async def get_nearby_places(lat: float, lng: float, current_user: dict = Depends(get_current_user)):
    import httpx
    
    google_api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    
    if not google_api_key or google_api_key == "your_google_maps_api_key":
        # Return mock data if no valid API key
        mock_places = [
            {
                "name": "Local Coffee House",
                "type": "cafe",
                "distance": "0.3 km",
                "rating": 4.5,
                "address": "123 Main St",
                "place_id": "mock_1"
            },
            {
                "name": "Co-working Space", 
                "type": "workspace",
                "distance": "0.5 km",
                "rating": 4.2,
                "address": "456 Business Ave",
                "place_id": "mock_2"
            },
            {
                "name": "Art Gallery Opening",
                "type": "event",
                "distance": "0.8 km", 
                "rating": 4.7,
                "address": "789 Culture St",
                "place_id": "mock_3"
            }
        ]
        
        persona = current_user.get("selected_persona", "casualBuddy")
        message = get_persona_message("explore_event", persona)
        
        return {
            "places": mock_places,
            "message": message,
            "mock_data": True
        }
    
    try:
        # Use Google Places API to get nearby places
        async with httpx.AsyncClient() as client:
            # Search for interesting places nearby
            search_types = ["cafe", "restaurant", "tourist_attraction", "museum", "park", "library"]
            all_places = []
            
            for place_type in search_types[:3]:  # Limit to 3 types to avoid too many API calls
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    "location": f"{lat},{lng}",
                    "radius": 2000,  # 2km radius
                    "type": place_type,
                    "key": google_api_key
                }
                
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for place in data.get("results", [])[:2]:  # Take top 2 from each type
                        place_info = {
                            "name": place.get("name", "Unknown Place"),
                            "type": place_type,
                            "rating": place.get("rating", 0),
                            "address": place.get("vicinity", "Address not available"),
                            "place_id": place.get("place_id"),
                            "price_level": "€" * place.get("price_level", 1) if place.get("price_level") else "Free",
                            "open_now": place.get("opening_hours", {}).get("open_now", None)
                        }
                        
                        # Calculate approximate distance (simplified)
                        place_lat = place.get("geometry", {}).get("location", {}).get("lat", lat)
                        place_lng = place.get("geometry", {}).get("location", {}).get("lng", lng)
                        
                        # Simple distance calculation (not accurate, but good enough for display)
                        distance = ((lat - place_lat) ** 2 + (lng - place_lng) ** 2) ** 0.5 * 111  # Rough km conversion
                        place_info["distance"] = f"{distance:.1f} km"
                        
                        all_places.append(place_info)
            
            # Sort by rating and take top 5
            all_places.sort(key=lambda x: x["rating"], reverse=True)
            selected_places = all_places[:5]
            
            persona = current_user.get("selected_persona", "casualBuddy")
            message = get_persona_message("explore_event", persona)
            
            return {
                "places": selected_places,
                "message": message,
                "mock_data": False
            }
            
    except Exception as e:
        print(f"Google Maps API error: {e}")
        
        # Fallback to mock data on API failure
        mock_places = [
            {
                "name": "Nearby Coffee Shop",
                "type": "cafe", 
                "distance": "0.4 km",
                "rating": 4.3,
                "address": "Local Area"
            },
            {
                "name": "Community Center",
                "type": "community",
                "distance": "0.7 km", 
                "rating": 4.1,
                "address": "Downtown"
            }
        ]
        
        persona = current_user.get("selected_persona", "casualBuddy")
        message = get_persona_message("explore_event", persona)
        
        return {
            "places": mock_places,
            "message": message,
            "mock_data": True,
            "error": "API unavailable"
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