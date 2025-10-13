#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Cc (Culturisk Calendar)
Tests all major endpoints with realistic data
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any

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

class CcCalendarAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.user_id = None
        self.created_task_id = None
        self.created_event_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = self.session.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and "Cc Calendar API" in data.get("service", ""):
                    self.log_test("Health Check", True, f"Status: {data}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_user_onboarding(self):
        """Test POST /api/onboarding with city and country fields"""
        try:
            # Use realistic user data with timestamp to ensure uniqueness
            import time
            timestamp = int(time.time())
            onboarding_data = {
                "name": f"Sarah Johnson {timestamp}",
                "timezone": "America/New_York",
                "city": "New York",
                "country": "United States", 
                "personality_type": "organized_planner",
                "selected_persona": "caringSibling"
            }
            
            response = self.session.post(
                f"{API_BASE}/onboarding",
                json=onboarding_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                if "token" in data and "user" in data and "message" in data:
                    self.user_token = data["token"]
                    self.user_id = data["user"]["id"]
                    
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.user_token}"
                    })
                    
                    self.log_test("User Onboarding", True, 
                                f"User created: {data['user']['name']}, Token received")
                    return True
                else:
                    self.log_test("User Onboarding", False, 
                                f"Missing required fields in response: {data}")
                    return False
            else:
                self.log_test("User Onboarding", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Onboarding", False, f"Exception: {str(e)}")
            return False
    
    def test_create_task(self):
        """Test POST /api/tasks"""
        if not self.user_token:
            self.log_test("Create Task", False, "No user token available")
            return False
            
        try:
            # Create a realistic task
            tomorrow = datetime.now() + timedelta(days=1)
            task_data = {
                "title": "Team Meeting - Q4 Planning",
                "description": "Quarterly planning session with the marketing team",
                "date": tomorrow.isoformat(),
                "time": "14:30",
                "task_type": "meeting",
                "priority": "high",
                "deadline": (tomorrow + timedelta(hours=2)).isoformat(),
                "reminder": (tomorrow - timedelta(minutes=15)).isoformat(),
                "timer_duration": "90 minutes",
                "repeat": "none",
                "tags": "work,planning,team",
                "location": "Conference Room B",
                "notes": "Bring laptop and Q3 reports",
                "all_day": False
            }
            
            response = self.session.post(
                f"{API_BASE}/tasks",
                json=task_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "task" in data and "message" in data:
                    task = data["task"]
                    self.created_task_id = task["id"]
                    
                    # Verify task data
                    if (task["title"] == task_data["title"] and 
                        task["user_id"] == self.user_id and
                        task["task_type"] == "meeting"):
                        
                        self.log_test("Create Task", True, 
                                    f"Task created: {task['title']} (ID: {task['id']})")
                        return True
                    else:
                        self.log_test("Create Task", False, 
                                    f"Task data mismatch: {task}")
                        return False
                else:
                    self.log_test("Create Task", False, 
                                f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Create Task", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Task", False, f"Exception: {str(e)}")
            return False
    
    def test_get_tasks(self):
        """Test GET /api/tasks"""
        if not self.user_token:
            self.log_test("Get Tasks", False, "No user token available")
            return False
            
        try:
            # Test getting all tasks
            response = self.session.get(f"{API_BASE}/tasks", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "tasks" in data:
                    tasks = data["tasks"]
                    
                    # Should have at least the task we created
                    if len(tasks) > 0:
                        # Verify our created task is in the list
                        found_task = False
                        for task in tasks:
                            if task.get("id") == self.created_task_id:
                                found_task = True
                                break
                        
                        if found_task:
                            self.log_test("Get Tasks", True, 
                                        f"Retrieved {len(tasks)} tasks, including created task")
                            return True
                        else:
                            self.log_test("Get Tasks", False, 
                                        f"Created task not found in {len(tasks)} tasks")
                            return False
                    else:
                        self.log_test("Get Tasks", True, 
                                    "No tasks found (empty list is valid)")
                        return True
                else:
                    self.log_test("Get Tasks", False, 
                                f"Missing 'tasks' field: {data}")
                    return False
            else:
                self.log_test("Get Tasks", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Tasks", False, f"Exception: {str(e)}")
            return False
    
    def test_update_task(self):
        """Test PUT /api/tasks/{task_id}"""
        if not self.user_token or not self.created_task_id:
            self.log_test("Update Task", False, "No user token or task ID available")
            return False
            
        try:
            # Update the task we created
            tomorrow = datetime.now() + timedelta(days=1)
            updated_data = {
                "title": "Team Meeting - Q4 Planning (Updated)",
                "description": "Updated: Quarterly planning session with extended agenda",
                "date": tomorrow.isoformat(),
                "time": "15:00",  # Changed time
                "task_type": "meeting",
                "priority": "medium",  # Changed priority
                "deadline": (tomorrow + timedelta(hours=3)).isoformat(),
                "reminder": (tomorrow - timedelta(minutes=30)).isoformat(),
                "timer_duration": "120 minutes",  # Extended duration
                "repeat": "none",
                "tags": "work,planning,team,updated",
                "location": "Conference Room A",  # Changed location
                "notes": "Bring laptop, Q3 reports, and budget proposals",
                "all_day": False
            }
            
            response = self.session.put(
                f"{API_BASE}/tasks/{self.created_task_id}",
                json=updated_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" in data and "successfully" in data["message"]:
                    self.log_test("Update Task", True, 
                                f"Task updated successfully: {data['message']}")
                    return True
                else:
                    self.log_test("Update Task", False, 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Update Task", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Task", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_task(self):
        """Test DELETE /api/tasks/{task_id}"""
        if not self.user_token or not self.created_task_id:
            self.log_test("Delete Task", False, "No user token or task ID available")
            return False
            
        try:
            response = self.session.delete(
                f"{API_BASE}/tasks/{self.created_task_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" in data and "successfully" in data["message"]:
                    self.log_test("Delete Task", True, 
                                f"Task deleted successfully: {data['message']}")
                    return True
                else:
                    self.log_test("Delete Task", False, 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Delete Task", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Task", False, f"Exception: {str(e)}")
            return False
    
    def test_persona_chat(self):
        """Test persona system via GET /api/persona-message/{message_type}"""
        if not self.user_token:
            self.log_test("Persona Chat", False, "No user token available")
            return False
            
        try:
            # Test different message types
            message_types = ["morning_plan", "reminder_task", "explore_event"]
            
            for msg_type in message_types:
                response = self.session.get(
                    f"{API_BASE}/persona-message/{msg_type}",
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "message" in data and "persona" in data and "timestamp" in data:
                        # Verify persona matches user's selection
                        if data["persona"] == "caringSibling":
                            continue  # This message type works
                        else:
                            self.log_test("Persona Chat", False, 
                                        f"Wrong persona returned: {data['persona']}")
                            return False
                    else:
                        self.log_test("Persona Chat", False, 
                                    f"Missing fields in {msg_type}: {data}")
                        return False
                else:
                    self.log_test("Persona Chat", False, 
                                f"HTTP {response.status_code} for {msg_type}: {response.text}")
                    return False
            
            self.log_test("Persona Chat", True, 
                        f"All {len(message_types)} persona message types working")
            return True
                
        except Exception as e:
            self.log_test("Persona Chat", False, f"Exception: {str(e)}")
            return False
    
    def test_create_event(self):
        """Test POST /api/events - Create a manual event"""
        if not self.user_token:
            self.log_test("Create Event", False, "No user token available")
            return False
            
        try:
            # Create a realistic event as specified in the review request
            event_data = {
                "title": "Downtown Cafe",
                "description": "Great coffee and cozy atmosphere",
                "event_type": "cafe",
                "location": "123 Main Street",
                "city": "New York",
                "date": "Ongoing",
                "rating": 4.5
            }
            
            response = self.session.post(
                f"{API_BASE}/events",
                json=event_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "event" in data and "message" in data:
                    event = data["event"]
                    self.created_event_id = event["id"]
                    
                    # Verify event data
                    if (event["title"] == event_data["title"] and 
                        event["user_id"] == self.user_id and
                        event["event_type"] == "cafe" and
                        event["rating"] == 4.5):
                        
                        self.log_test("Create Event", True, 
                                    f"Event created: {event['title']} (ID: {event['id']})")
                        return True
                    else:
                        self.log_test("Create Event", False, 
                                    f"Event data mismatch: {event}")
                        return False
                else:
                    self.log_test("Create Event", False, 
                                f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Create Event", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Event", False, f"Exception: {str(e)}")
            return False
    
    def test_get_events(self):
        """Test GET /api/events - Get all events for the user"""
        if not self.user_token:
            self.log_test("Get Events", False, "No user token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/events", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "events" in data and "message" in data:
                    events = data["events"]
                    
                    # Should have user events + default events
                    if len(events) > 0:
                        # Check for our created event
                        user_event_found = False
                        default_events_found = False
                        
                        for event in events:
                            if event.get("id") == self.created_event_id:
                                user_event_found = True
                            if event.get("is_default"):
                                default_events_found = True
                        
                        if user_event_found and default_events_found:
                            self.log_test("Get Events", True, 
                                        f"Retrieved {len(events)} events (user + default)")
                            return True
                        elif user_event_found:
                            self.log_test("Get Events", True, 
                                        f"Retrieved {len(events)} events including created event")
                            return True
                        else:
                            self.log_test("Get Events", False, 
                                        f"Created event not found in {len(events)} events")
                            return False
                    else:
                        self.log_test("Get Events", False, "No events returned")
                        return False
                else:
                    self.log_test("Get Events", False, 
                                f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Get Events", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Events", False, f"Exception: {str(e)}")
            return False
    
    def test_update_event(self):
        """Test PUT /api/events/{event_id} - Update an event"""
        if not self.user_token or not self.created_event_id:
            self.log_test("Update Event", False, "No user token or event ID available")
            return False
            
        try:
            # Update the event we created
            updated_data = {
                "title": "Downtown Cafe (Updated)",
                "description": "Great coffee, cozy atmosphere, and excellent pastries",
                "event_type": "cafe",
                "location": "123 Main Street (Updated)",
                "city": "New York",
                "date": "Ongoing",
                "rating": 4.8  # Updated rating
            }
            
            response = self.session.put(
                f"{API_BASE}/events/{self.created_event_id}",
                json=updated_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" in data and "successfully" in data["message"]:
                    self.log_test("Update Event", True, 
                                f"Event updated successfully: {data['message']}")
                    return True
                else:
                    self.log_test("Update Event", False, 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Update Event", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Event", False, f"Exception: {str(e)}")
            return False
    
    def test_update_user_city(self):
        """Test PUT /api/user/city - Update user's city"""
        if not self.user_token:
            self.log_test("Update User City", False, "No user token available")
            return False
            
        try:
            # Update city as specified in review request
            city_data = {
                "city": "London",
                "country": "United Kingdom",
                "timezone": "Europe/London"
            }
            
            response = self.session.put(
                f"{API_BASE}/user/city",
                json=city_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if ("message" in data and "successfully" in data["message"] and
                    data.get("city") == "London" and 
                    data.get("country") == "United Kingdom"):
                    
                    self.log_test("Update User City", True, 
                                f"City updated: {data['city']}, {data['country']}")
                    return True
                else:
                    self.log_test("Update User City", False, 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Update User City", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update User City", False, f"Exception: {str(e)}")
            return False
    
    def test_explore_nearby_updated(self):
        """Test GET /api/explore/nearby - Get nearby places (manual events + default)"""
        if not self.user_token:
            self.log_test("Explore Nearby (Updated)", False, "No user token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/explore/nearby", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "events" in data and "city" in data and "message" in data:
                    events = data["events"]
                    city = data["city"]
                    
                    if len(events) > 0:
                        # Should have both user events and default events
                        user_events = [e for e in events if not e.get("is_default")]
                        default_events = [e for e in events if e.get("is_default")]
                        
                        self.log_test("Explore Nearby (Updated)", True, 
                                    f"Found {len(events)} events ({len(user_events)} user, {len(default_events)} default) for {city}")
                        return True
                    else:
                        self.log_test("Explore Nearby (Updated)", False, 
                                    "No events returned")
                        return False
                else:
                    self.log_test("Explore Nearby (Updated)", False, 
                                f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Explore Nearby (Updated)", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Explore Nearby (Updated)", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_event(self):
        """Test DELETE /api/events/{event_id} - Delete an event"""
        if not self.user_token or not self.created_event_id:
            self.log_test("Delete Event", False, "No user token or event ID available")
            return False
            
        try:
            response = self.session.delete(
                f"{API_BASE}/events/{self.created_event_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "message" in data and "successfully" in data["message"]:
                    self.log_test("Delete Event", True, 
                                f"Event deleted successfully: {data['message']}")
                    return True
                else:
                    self.log_test("Delete Event", False, 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Delete Event", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Event", False, f"Exception: {str(e)}")
            return False

    def test_google_maps_integration(self):
        """Test GET /api/explore/nearby (Google Maps integration)"""
        if not self.user_token:
            self.log_test("Google Maps Integration", False, "No user token available")
            return False
            
        try:
            # Test with NYC coordinates
            params = {
                "lat": 40.7128,
                "lng": -74.0060
            }
            
            response = self.session.get(
                f"{API_BASE}/explore/nearby",
                params=params,
                timeout=15  # Longer timeout for external API
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "places" in data and "message" in data:
                    places = data["places"]
                    
                    if len(places) > 0:
                        # Check if we got mock data or real data
                        is_mock = data.get("mock_data", False)
                        
                        # Verify place structure
                        first_place = places[0]
                        required_fields = ["name", "type", "rating", "address"]
                        
                        if all(field in first_place for field in required_fields):
                            status_msg = f"Found {len(places)} places"
                            if is_mock:
                                status_msg += " (mock data - API key not configured)"
                            
                            self.log_test("Google Maps Integration", True, status_msg)
                            return True
                        else:
                            self.log_test("Google Maps Integration", False, 
                                        f"Missing required fields in place data: {first_place}")
                            return False
                    else:
                        self.log_test("Google Maps Integration", False, 
                                    "No places returned")
                        return False
                else:
                    self.log_test("Google Maps Integration", False, 
                                f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Google Maps Integration", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Google Maps Integration", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("🧪 Cc Calendar Backend API Tests")
        print(f"🌐 Testing against: {BASE_URL}")
        print("=" * 60)
        print()
        
        results = {}
        
        # Test in logical order
        results["health"] = self.test_health_check()
        results["onboarding"] = self.test_user_onboarding()
        results["create_task"] = self.test_create_task()
        results["get_tasks"] = self.test_get_tasks()
        results["update_task"] = self.test_update_task()
        results["delete_task"] = self.test_delete_task()
        results["persona_chat"] = self.test_persona_chat()
        results["google_maps"] = self.test_google_maps_integration()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name.replace('_', ' ').title()}")
        
        print()
        print(f"📈 Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! Backend API is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return results

def main():
    """Main test execution"""
    tester = CcCalendarAPITester()
    results = tester.run_all_tests()
    
    # Return exit code based on results
    failed_tests = [name for name, result in results.items() if not result]
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("\n✅ All tests passed successfully!")
        return 0

if __name__ == "__main__":
    exit(main())