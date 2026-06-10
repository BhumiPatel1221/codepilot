FROM eclipse-temurin:21-jdk

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash coreutils \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /runner

COPY run.sh /runner/run.sh
RUN chmod +x /runner/run.sh

CMD ["/bin/bash"]
