from flask import Flask, jsonify, send_file, Response, request
from flask_cors import CORS
import random, os, datetime
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv() 

app = Flask(__name__)
CORS(app)

MONGODB_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('DB_NAME')

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
leaderboard_collection = db['leaderboard']
destroyed_ship_collection = db['destroyed_ships']

@app.route('/generate_visual', methods=['GET'])
def generate_visual():
    sprite_id = random.randint(0, 1)
    
    base_r = random.randint(50, 255)
    base_g = random.randint(50, 255)
    base_b = random.randint(50, 255)
    
    shadow = [
        max(base_r - 80, 0),
        max(base_g - 80, 0),
        max(base_b - 80, 0)
    ]
    
    return jsonify({
        "sprite_id": sprite_id,
        "color_base": [base_r, base_g, base_b],
        "color_shadow": shadow
    })

@app.route('/leaderboard/<game_mode>', methods=['GET'])
def get_leaderboard(game_mode):

    res = list(leaderboard_collection.find({
        "game_mode": game_mode
    }).sort("score", -1))

    for item in res:
        item['_id'] = str(item['_id'])

    return jsonify(res), 200

@app.route('/leaderboard/user/<address>/<game_mode>', methods=['GET'])
def get_user_rank(address, game_mode):
    
    user_entry = leaderboard_collection.find_one({
        "address": address,
        "game_mode": game_mode
    })

    if not user_entry:
        return jsonify({"error": "User not found in leaderboard"}), 400
    
    if game_mode not in ['FREE', 'COMPETITIVE']:
        return jsonify({"error": "Game mode must be 'FREE' or 'COMPETITIVE'"}), 400

    all_entries = list(leaderboard_collection.find({
        "game_mode": game_mode
    }).sort("score", -1))

    user_rank = None
    for i, entry in enumerate(all_entries):
        if str(entry['_id']) == str(user_entry['_id']):
            user_rank = i + 1 
            break

    if user_rank is None:
        return jsonify({"error": "Could not determine rank"}), 500
    
    user_entry['_id'] = str(user_entry['_id'])
    user_entry['rank'] = user_rank

    return jsonify(user_entry), 200

@app.route('/submit_score', methods=['POST'])
def submit_score():
    try:
        data = request.get_json()
        
        required_fields = ['address', 'score', 'combo', 'game_mode']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        address = data['address']
        score = data['score']
        combo = data['combo']
        game_mode = data['game_mode']
        
        if not isinstance(score, (int, float)) or score < 0:
            return jsonify({"error": "Score must be a positive number"}), 400
        
        if not isinstance(combo, int) or combo < 0:
            return jsonify({"error": "Combo must be a positive integer"}), 400
        
        if game_mode not in ['FREE', 'COMPETITIVE']:
            return jsonify({"error": "Game mode must be 'FREE' or 'COMPETITIVE'"}), 400
        
        existing_entry = leaderboard_collection.find_one({
            "address": address,
            "game_mode": game_mode
        })
        
        timestamp = datetime.datetime.utcnow().isoformat()
        
        if existing_entry:
            if score > existing_entry['score']:
                result = leaderboard_collection.update_one(
                    {"_id": existing_entry['_id']},
                    {"$set": {
                        "score": score,
                        "combo": combo,
                        "timestamp": timestamp
                    }}
                )
                
                if result.modified_count > 0:
                    return jsonify({
                        "message": "Score updated successfully",
                        "action": "UPDATED",
                        "previous_score": existing_entry['score'],
                        "new_score": score
                    }), 200
                else:
                    return jsonify({"error": "Failed to update score"}), 500
            else:
                return jsonify({
                    "message": "Existing score is higher or equal, no update needed",
                    "action": "SKIPPED",
                    "existing_score": existing_entry['score'],
                    "new_score": score
                }), 200
        else:
            try:
                new_entry = {
                    "address": address,
                    "score": score,
                    "combo": combo,
                    "game_mode": game_mode,
                    "timestamp": timestamp
                }
                
                result = leaderboard_collection.insert_one(new_entry)

                return jsonify({"message": "Score submitted successfully"}), 200
            except:
                return jsonify({"error": "Failed to submit score"}), 500
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/destroy_ship', methods=['POST'])
def destroy_ship():
    try:
        data = request.get_json()
        required_fields = ['address', 'id_ship']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        address = data['address']
        id_ship = data['id_ship']

        if not isinstance(id_ship, (int, float)) or id_ship < 0:
            return jsonify({"error": "Id_ship must be a positive number"}), 400

        new_entry = {
            "address": address,
            "id_ship": id_ship,
        }
                
        result = destroyed_ship_collection.insert_one(new_entry)

        return jsonify({"message": "Score submitted successfully"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user/<address>/ships_destroyed', methods=['GET'])
def ships_destroyed(address):
    
    res = list(destroyed_ship_collection.find({
        "address": address
    }))

    for item in res:
        item['_id'] = str(item['_id'])

    return jsonify(res), 200

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)