FROM node:16-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-server ca-certificates curl netcat-openbsd dumb-init \
    sshguard openssl systemd\
 && rm -rf /var/lib/apt/lists/*

# Runtime user for the app process SSHD must run as root, sessions drop to this user
ARG USER=player
ARG UID=1001
RUN useradd -u ${UID} -m -s /bin/bash ${USER}

# SSH runtime
RUN mkdir -p /var/run/sshd /etc/ssh/keys && chmod 0755 /var/run/sshd
RUN mkdir -p /etc/pam.d

WORKDIR /app

COPY package.json /app
RUN npm install --package-lock-only
RUN npm ci

COPY ./CLI /app/cli

COPY sshd_config /etc/ssh/sshd_config
COPY run_pong_cli.sh /usr/local/bin/run_pong_cli.sh
RUN chmod 0755 /usr/local/bin/run_pong_cli.sh


COPY pam_allow_noprompt.sh /usr/local/bin/pam_allow_noprompt.sh
RUN chmod 0755 /usr/local/bin/pam_allow_noprompt.sh

# Banner
RUN printf "Welcome to Pong CLI Gateway. SSH has no password; login happens inside the game client.\n" > /etc/issue.net

COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh


RUN touch /var/log/auth.log && chown root:adm /var/log/auth.log

EXPOSE 22
ENTRYPOINT ["/usr/bin/dumb-init","--"]
CMD ["/usr/local/bin/entrypoint.sh"]
