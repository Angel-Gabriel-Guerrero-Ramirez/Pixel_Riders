from flask import Flask, jsonify
import random, json, os
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://userBuffon:Buffones4444@cluster0.eq3jpt4.mongodb.net/')
client = MongoClient(MONGO_URI)
db = client['BazarUniversal']
productCollection = db['products']
SaleCollection = db['sales']

@app.get("/generateShip")
def generateShipVisualData():
    sprite_id = random.randint(0, 4)  # 5 sprites base

    def rgb():
        return [random.randint(0, 255),
                random.randint(0, 255),
                random.randint(0, 255)]

    return jsonify({
        "sprite": sprite_id,
        "light": rgb(),
        "mid": rgb(),
        "dark": rgb()
    })

@app.get("/getShips")
def getShips():

    #Recuperacion de las naves

    return jsonify({

    })

if __name__ == "__main__":
    app.run(debug=True)