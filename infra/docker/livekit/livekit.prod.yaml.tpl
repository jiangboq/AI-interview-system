port: 7880
rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: true

keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}

logging:
  level: info
  json: true
