import http.cookiejar
import json
import os
import urllib.error
import urllib.request
import uuid

BASE=os.environ.get("ACADEMY_TEST_URL","http://127.0.0.1:3000")

class Actor:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def request(self, path, data=None, method=None, expected=200, raw=None, mime=None):
        method = method or ('POST' if data is not None or raw is not None else 'GET')
        body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
        headers = {'Origin': BASE}
        if body is not None:
            headers['Content-Type'] = mime or 'application/json'
        req = urllib.request.Request(BASE + '/api/' + path, data=body, method=method, headers=headers)
        try:
            response = self.client.open(req, timeout=60)
        except urllib.error.HTTPError as error:
            response = error
        content = response.read()
        assert response.code == expected, f'{method} {path}: expected {expected}, got {response.code}; {content[:500].decode(errors="replace")}'
        return json.loads(content) if 'application/json' in response.headers.get('Content-Type', '') else content

    def login(self, email, password):
        return self.request('auth/login', {'email': email, 'password': password})

    def evidence(self, record_id):
        boundary = 'AcademyBoundary' + uuid.uuid4().hex
        content = (f'--{boundary}\r\nContent-Disposition: form-data; name="submissionId"\r\n\r\n{record_id}\r\n'
                   f'--{boundary}\r\nContent-Disposition: form-data; name="classification"\r\n\r\nsynthetic\r\n'
                   f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="synthetic-evidence.txt"\r\nContent-Type: text/plain\r\n\r\n'
                   'SYNTHETIC TRAINING EVIDENCE. This file documents a fictional exercise. It does not verify live sales, suppliers, delivery, or payments.\r\n'
                   f'--{boundary}--\r\n').encode()
        return self.request('uploads', raw=content, mime='multipart/form-data; boundary=' + boundary)
