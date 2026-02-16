#!/usr/bin/env bash
set -euo pipefail

# Entrypoint: host keys, sshguard, start sshd
echo "export LC_CTYPE=en_US.UTF-8" >> /home/player/.bashrc
echo "export LANG=en_US.UTF-8" >> /home/player/.bashrc

source /home/player/.bashrc

umask 027
for t in rsa ed25519; do
  k="/etc/ssh/keys/ssh_host_${t}_key"
  [ -s "$k" ] || ssh-keygen -q -t "$t" -f "$k" -N ""
  ln -sf "$k"     "/etc/ssh/ssh_host_${t}_key"
  ln -sf "$k.pub" "/etc/ssh/ssh_host_${t}_key.pub"
done
chmod 600 /etc/ssh/keys/ssh_host_*_key

ln -sf /etc/ssh/keys/ssh_host_rsa_key     /etc/ssh/ssh_host_rsa_key
ln -sf /etc/ssh/keys/ssh_host_ed25519_key /etc/ssh/ssh_host_ed25519_key
if [ "${ENABLE_SSHGUARD:-0}" = "1" ]; then
  sshguard -a 3 -p 120 -w /var/log/auth.log &
fi
/usr/sbin/sshd -t
exec /usr/sbin/sshd -D -e -o UsePAM=yes