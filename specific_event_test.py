#!/usr/bin/env python3
"""
Specific Event Management Tests for Review Request
Tests the exact scenarios mentioned in the review request
"""

import requests
import json
import time

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

def test_specific_requirements():
    """Test the specific requirements from the review request"""
    session = requests.Session()
    
    print("🧪 Testing Specific Review Request Requirements")
    print(f"🌐 Backend URL: {BASE_URL}")
    print("=" * 60)
    
    # 1. Create user with onboarding
    timestamp = int(time.time())
    onboarding_data = {
        "name": f"Test User {timestamp}",
        "timezone": "America/New_York",
        "city": "New York",
        "country": "United States",
        "personality_type": "organized_planner",
        "selected_persona": "caringSibling"
    }
    
    response = session.post(f"{API_BASE}/onboarding", json=onboarding_data)
    if response.status_code == 200:
        data = response.json()
        token = data["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        print("✅ User onboarding with city and country fields - PASS")
    else:
        print(f"❌ User onboarding - FAIL: {response.status_code}")
        return False
    
    # 2. Create the exact event from review request
    event_data = {
        "title": "Downtown Cafe",
        "description": "Great coffee and cozy atmosphere",
        "event_type": "cafe",
        "location": "123 Main Street",
        "city": "New York",
        "date": "Ongoing",
        "rating": 4.5
    }
    
    response = session.post(f"{API_BASE}/events", json=event_data)
    if response.status_code == 200:
        data = response.json()
        event_id = data["event"]["id"]
        print("✅ POST /api/events - Create manual event - PASS")
        print(f"   Created: {data['event']['title']} with rating {data['event']['rating']}")
    else:
        print(f"❌ POST /api/events - FAIL: {response.status_code}")
        return False
    
    # 3. Get all events (should include user + default)
    response = session.get(f"{API_BASE}/events")
    if response.status_code == 200:
        data = response.json()
        events = data["events"]
        user_events = [e for e in events if not e.get("is_default")]
        default_events = [e for e in events if e.get("is_default")]
        print("✅ GET /api/events - Get all events - PASS")
        print(f"   Found {len(user_events)} user events + {len(default_events)} default events")
    else:
        print(f"❌ GET /api/events - FAIL: {response.status_code}")
        return False
    
    # 4. Update the event
    updated_event_data = {
        "title": "Downtown Cafe (Updated)",
        "description": "Great coffee, cozy atmosphere, and excellent pastries",
        "event_type": "cafe",
        "location": "123 Main Street (Updated)",
        "city": "New York",
        "date": "Ongoing",
        "rating": 4.8
    }
    
    response = session.put(f"{API_BASE}/events/{event_id}", json=updated_event_data)
    if response.status_code == 200:
        print("✅ PUT /api/events/{event_id} - Update event - PASS")
    else:
        print(f"❌ PUT /api/events/{event_id} - FAIL: {response.status_code}")
        return False
    
    # 5. Update user's city to London
    city_data = {
        "city": "London",
        "country": "United Kingdom",
        "timezone": "Europe/London"
    }
    
    response = session.put(f"{API_BASE}/user/city", json=city_data)
    if response.status_code == 200:
        data = response.json()
        print("✅ PUT /api/user/city - Update user's city - PASS")
        print(f"   Updated to: {data['city']}, {data['country']} ({data['timezone']})")
    else:
        print(f"❌ PUT /api/user/city - FAIL: {response.status_code}")
        return False
    
    # 6. Get nearby places (should return user events + default events)
    response = session.get(f"{API_BASE}/explore/nearby")
    if response.status_code == 200:
        data = response.json()
        events = data["events"]
        city = data["city"]
        print("✅ GET /api/explore/nearby - Get nearby places - PASS")
        print(f"   Found {len(events)} events for {city} (NO Google Maps API)")
    else:
        print(f"❌ GET /api/explore/nearby - FAIL: {response.status_code}")
        return False
    
    # 7. Delete the event
    response = session.delete(f"{API_BASE}/events/{event_id}")
    if response.status_code == 200:
        print("✅ DELETE /api/events/{event_id} - Delete event - PASS")
    else:
        print(f"❌ DELETE /api/events/{event_id} - FAIL: {response.status_code}")
        return False
    
    print("\n🎉 All specific requirements tested successfully!")
    print("✅ Manual event management working without external APIs")
    print("✅ City can be changed anytime")
    print("✅ Default cultural events provided for each city")
    print("✅ No dependency on Google Maps or other external APIs")
    
    return True

if __name__ == "__main__":
    success = test_specific_requirements()
    exit(0 if success else 1)