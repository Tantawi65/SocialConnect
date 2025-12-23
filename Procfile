web: gunicorn social_connect.wsgi --log-file -
release: python manage.py migrate --noinput && python manage.py collectstatic --noinput
