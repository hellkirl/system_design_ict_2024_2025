FROM golang:1.24.0-alpine AS build

RUN apk update && \
    apk add --no-cache ca-certificates tzdata && \
    update-ca-certificates

WORKDIR /app

COPY go.mod ./

RUN go mod download

COPY . .

RUN mkdir -p bin && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/app main.go

FROM scratch AS final

COPY --from=build /usr/share/zoneinfo/Europe/Moscow /usr/share/zoneinfo/Europe/Moscow

COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

COPY --from=build /app/bin/app /app/

WORKDIR /app/

ENV TZ=Europe/Moscow \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

ENTRYPOINT ["./app"]