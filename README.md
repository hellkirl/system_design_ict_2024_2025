# Практическая работа №7 (k8s)

## Ход выполнения

1. Установили обновления на Ubuntu 24. Установили `kubectl`, `Docker` и наконец `minicube`:
![alt text](<static/installation_minicube.png>)

2. Создадим multi-stage образ базового [HTTP echo-сервера](/app/main.go) на Go:

```dockerfile
FROM golang:1.24.0-alpine # cобираем образ из alpine версии golang:1.24.0

RUN apk update && \
    apk add --no-cache ca-certificates tzdata git && \
    update-ca-certificates

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN mkdir -p bin && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w \
    -X ${VERSION_PATH}.buildDate=${BUILD_DATE} \
    -X ${VERSION_PATH}.gitTag=${APP_VERSION}" -o bin/app cmd/app/main.go # билдим бинарник

FROM scratch AS final # запускаем второй этап сборки из пустого образа

COPY --from=build /usr/share/zoneinfo/Europe/Moscow /usr/share/zoneinfo/Europe/Moscow

COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

COPY --from=build /app/bin/app /app/

WORKDIR /app/

ENV TZ=Europe/Moscow \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

ENTRYPOINT ["./app"] # запускаем бинарник
```

3. Теперь создадим deployment файл для k8s:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
      - name: echoserver_instance
        image: echoserver:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
```

4. Соберем образ сервера с помощью команды `docker build -t echoserver:latest ./` и создадим k8s deployment:
![alt text](<static/deployment.png>)

5. Увеличим число реплик приложения: `kubectl scale deployments/app-deployment --replicas=3`:
![alt text](<static/scaling.png>)

6. Добавим Metrics Server:
![alt text](<static/metrics.png>)

7. Установим autoscale для нашего deployment:
![alt text](<static/autoscaling.png>)

8. Установим Helm: 
![alt text](<static/helm.png>)

9. Теперь займемся настройкой Prometheus и Grafana:
![alt text](<static/grafanaprom1.png>)
![alt text](<static/grafanaprom2.png>)
![alt text](<static/grafanaprom3.png>)

10. Теперь создадим дашборд для deployment нашего приложения:
![alt text](<static/dashboard.png>)
[Видео защиты практической работы](https://drive.google.com/file/d/1Cju2NSJ2CAzyzQQCXTgxYhPnC3EZiuCi/view?usp=drive_link)
