#!/bin/bash

echo "=== ТЕСТИРОВАНИЕ ЧАТОВ ==="
echo ""

BASE_URL="http://localhost:3001"

make_request() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    
    echo "➡️ $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "|%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data")
    else
        response=$(curl -s -w "|%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token")
    fi
    
    body=$(echo "$response" | cut -d'|' -f1)
    status_code=$(echo "$response" | cut -d'|' -f2)
    
    echo "📊 Status: $status_code"
    if [ -n "$body" ] && [ "$body" != "null" ]; then
        echo "📦 Response: $body"
    fi
    echo ""
    
    echo "$body"
}

echo "🎯 СЦЕНАРИЙ 1: Приватный чат между пользователями"
echo "================================================"

echo "1. 📝 Регистрация тестовых пользователей..."
make_request POST "/auth/register" "" '{"username": "test_user_1", "password": "password123"}'
make_request POST "/auth/register" "" '{"username": "test_user_2", "password": "password123"}'
make_request POST "/auth/register" "" '{"username": "test_user_3", "password": "password123"}'

echo "2. 🔐 Получение JWT токенов..."
token1_response=$(make_request POST "/auth/login" "" '{"username": "test_user_1", "password": "password123"}')
token2_response=$(make_request POST "/auth/login" "" '{"username": "test_user_2", "password": "password123"}')

TOKEN1=$(echo "$token1_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
TOKEN2=$(echo "$token2_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "✅ Токен User1: $TOKEN1"
echo "✅ Токен User2: $TOKEN2"
echo ""

echo "3. 💬 Создание приватного чата..."
chat_response=$(make_request POST "/chats/private" "$TOKEN1" '{"targetUserId": 2}')
CHAT_ID=$(echo "$chat_response" | grep -o '"id":\s*[0-9]*' | cut -d':' -f2 | tr -d ' ')

if [ -z "$CHAT_ID" ]; then
    CHAT_ID=1
    echo "⚠️  Используем ID чата по умолчанию: $CHAT_ID"
else
    echo "✅ Создан чат с ID: $CHAT_ID"
fi
echo ""

echo "4. ✉️  Отправка сообщений в приватный чат..."
make_request POST "/chats/$CHAT_ID/messages" "$TOKEN1" '{"content": "Привет! Это сообщение от User1"}'
make_request POST "/chats/$CHAT_ID/messages" "$TOKEN2" '{"content": "Привет, User1! Как твои дела?"}'
make_request POST "/chats/$CHAT_ID/messages" "$TOKEN1" '{"content": "Отлично! Спасибо что спросил(а). А у тебя?"}'

echo "5. 📨 Получение истории сообщений..."
make_request GET "/chats/$CHAT_ID/messages" "$TOKEN1"

echo "6. 📋 Получение списка чатов пользователя..."
make_request GET "/chats" "$TOKEN1"

echo ""
echo "🎯 СЦЕНАРИЙ 2: Групповой чат"
echo "============================"

echo "1. 👥 Создание группового чата..."
group_chat_response=$(make_request POST "/chats/group" "$TOKEN1" '{"name": "Общий рабочий чат", "participantIds": [2, 3]}')
GROUP_CHAT_ID=$(echo "$group_chat_response" | grep -o '"id":\s*[0-9]*' | cut -d':' -f2 | tr -d ' ')

if [ -z "$GROUP_CHAT_ID" ]; then
    GROUP_CHAT_ID=2
    echo "⚠️  Используем ID группового чата по умолчанию: $GROUP_CHAT_ID"
else
    echo "✅ Создан групповой чат с ID: $GROUP_CHAT_ID"
fi
echo ""

echo "2. ✉️  Отправка сообщений в групповой чат..."
make_request POST "/chats/$GROUP_CHAT_ID/messages" "$TOKEN1" '{"content": "Всем привет! Добро пожаловать в общий чат!"}'
make_request POST "/chats/$GROUP_CHAT_ID/messages" "$TOKEN2" '{"content": "Спасибо за приглашение! Рад быть здесь!"}'

echo "3. 📨 Получение сообщений группового чата..."
make_request GET "/chats/$GROUP_CHAT_ID/messages" "$TOKEN1"

echo "4. ➕ Добавление участника в групповой чат..."
make_request POST "/chats/$GROUP_CHAT_ID/participants" "$TOKEN1" '{"userId": 3}'

echo "5. 🗑️  Удаление участника из группового чата..."
make_request DELETE "/chats/$GROUP_CHAT_ID/participants/3" "$TOKEN1"

echo "6. 📋 Получение обновленного списка чатов..."
make_request GET "/chats" "$TOKEN1"

echo ""
echo "🎯 СЦЕНАРИЙ 3: Проверка безопасности"
echo "==================================="

echo "1. 🔒 Попытка доступа к чужому чату..."
make_request GET "/chats/$CHAT_ID/messages" "$TOKEN2"

echo "2. ❌ Попытка отправить сообщение в несуществующий чат..."
make_request POST "/chats/999/messages" "$TOKEN1" '{"content": "Тестовое сообщение"}'

echo ""
echo "=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ==="