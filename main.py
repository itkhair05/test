from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/download', methods=['POST'])
def download():
    tiktok_url = request.form.get('url')
    
    if not tiktok_url:
        return jsonify({'success': False, 'message': 'Thiếu tham số!'})

    api_url = f"https://tikwm.com/api/?url={requests.utils.quote(tiktok_url)}"
    
    try:
        response = requests.get(api_url)
        data = response.json()
        
        if data and 'data' in data:
            d = data['data']
            if 'images' in d and isinstance(d['images'], list) and d['images']:
                return jsonify({
                    'success': True,
                    'media_type': 'image',
                    'media_urls': d['images']
                })
            elif 'play' in d and d['play']:
                return jsonify({
                    'success': True,
                    'media_type': 'video',
                    'media_url': d['play']
                })
            else:
                return jsonify({'success': False, 'message': 'Không lấy được video hoặc ảnh, vui lòng thử lại!'})
        else:
            return jsonify({'success': False, 'message': 'Không lấy được dữ liệu, vui lòng thử lại!'})
    
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'message': 'Lỗi kết nối API!',
            'error': str(e),
            'trace': traceback.format_exc()
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=81)
