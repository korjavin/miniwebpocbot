#!/bin/bash

# This script tests the Pocketbase API to ensure it's working correctly

# Default Pocketbase URL
PB_URL=${NEXT_PUBLIC_PB_URL:-"http://localhost:8090"}

# Function to test if Pocketbase is running
test_pocketbase_running() {
    echo "Testing if Pocketbase is running at $PB_URL..."
    
    # Send a request to the health endpoint
    RESPONSE=$(curl -s "$PB_URL/_")
    
    if [[ $RESPONSE == *"PocketBase"* ]]; then
        echo -e "\n✅ Pocketbase is running!"
        return 0
    else
        echo -e "\n❌ Pocketbase is not running or not accessible at $PB_URL"
        return 1
    fi
}

# Function to test collections
test_collections() {
    echo "Testing if required collections exist..."
    
    # Check users collection
    USERS=$(curl -s "$PB_URL/api/collections/users/records?page=1&perPage=1")
    if [[ $USERS == *"items"* ]]; then
        echo "✅ Users collection exists"
    else
        echo "❌ Users collection does not exist or is not accessible"
    fi
    
    # Check questions collection
    QUESTIONS=$(curl -s "$PB_URL/api/collections/questions/records?page=1&perPage=1")
    if [[ $QUESTIONS == *"items"* ]]; then
        echo "✅ Questions collection exists"
    else
        echo "❌ Questions collection does not exist or is not accessible"
    fi
    
    # Check bets collection
    BETS=$(curl -s "$PB_URL/api/collections/bets/records?page=1&perPage=1")
    if [[ $BETS == *"items"* ]]; then
        echo "✅ Bets collection exists"
    else
        echo "❌ Bets collection does not exist or is not accessible"
    fi
}

# Function to create a test question
create_test_question() {
    echo "Creating a test question..."
    
    # Create a question
    RESPONSE=$(curl -s -X POST "$PB_URL/api/collections/questions/records" \
        -H "Content-Type: application/json" \
        -d '{
            "question_text": "Is this a test question?",
            "options": ["Yes", "No"],
            "status": "open"
        }')
    
    if [[ $RESPONSE == *"id"* ]]; then
        QUESTION_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "✅ Test question created with ID: $QUESTION_ID"
        return 0
    else
        echo "❌ Failed to create test question"
        return 1
    fi
}

# Main function
main() {
    echo "Pocketbase API Test Script"
    echo "=========================="
    
    # Test if Pocketbase is running
    test_pocketbase_running
    if [ $? -ne 0 ]; then
        echo "Exiting due to Pocketbase connection failure."
        exit 1
    fi
    
    # Test collections
    test_collections
    
    # Ask if user wants to create a test question
    read -p "Do you want to create a test question? (y/n): " CREATE_QUESTION
    if [[ $CREATE_QUESTION == "y" || $CREATE_QUESTION == "Y" ]]; then
        create_test_question
    fi
    
    echo -e "\nTests completed!"
}

# Run the main function
main
