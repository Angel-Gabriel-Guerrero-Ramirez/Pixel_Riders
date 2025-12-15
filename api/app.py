# backend/app.py
from flask import Flask, jsonify, send_file, Response
from flask_cors import CORS
import random
from PIL import Image, ImageOps, ImageDraw
import numpy as np
import io
import os
import base64

app = Flask(__name__)
CORS(app)

@app.route('/generate_visual', methods=['GET'])
def generate_visual():
    """Generar sprite_id (0-1) y 2 colores"""
    sprite_id = random.randint(0, 1)
    
    # Generar color base aleatorio
    base_r = random.randint(50, 255)
    base_g = random.randint(50, 255)
    base_b = random.randint(50, 255)
    
    # Color sombra (más oscuro)
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

if __name__ == '__main__':
    # Create sprite if no exist
    if not os.path.exists("sprites"):
        os.makedirs("sprites", exist_ok=True)
    app.run(port=5000, debug=True)