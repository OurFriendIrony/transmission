#!/bin/bash

# Which torrent states should be removed at 100% progress.
DONE_STATES=(
  "Seeding"
  "Stopped"
  "Finished"
  "Idle"
)
DONT_KEEP=(
  "exe"
  "png"
  "jpg"
  "jpeg"
  "mp3"
  "md"
  "txt"
)
FREQUENCY=60

while sleep ${FREQUENCY}; do
  # Use transmission-remote to get the torrent list from transmission-remote.
  TORRENT_LIST=$(transmission-remote --list | sed -e '1d' -e '$d' | awk '{print $1}' | sed -e 's/[^0-9]*//g')

  # Iterate through the torrents.
  for TORRENT_ID in $TORRENT_LIST; do
    INFO=$(transmission-remote --torrent "$TORRENT_ID" --info)

    PROGRESS=$(echo "$INFO" | sed -n 's/.*Percent Done: \(.*\)%.*/\1/p')
    STATE=$(echo "$INFO" | sed -n 's/.*State: \(.*\)/\1/p')
    NAME=$(echo "$INFO" | sed -n 's/.*Name: \(.*\)/\1/p')
    LOCATION=$(echo "$INFO" | sed -n 's/.*Location: \(.*\)/\1/p')

    if [[ "$PROGRESS" == "100" ]] && [[ "${DONE_STATES[@]}" =~ "$STATE" ]]; then
      # If the torrent is 100% done and the state is one of the done states.
      transmission-remote --torrent "$TORRENT_ID" --remove &>/dev/null
      echo "$(date +'%Y-%m-%d %H:%M:%S') [Complete] (#${TORRENT_ID}) ${NAME}"

      for extension in "${DONT_KEEP[@]}"; do
        find "${LOCATION}/${NAME}" -name "*.${extension}" -print0 | while read -d $'\0' file; do
          # Remove any files we know we dont want
          rm "$file"
        done
      done

      cp -r "${LOCATION}/${NAME}" "/home/steve/media/new/"
      rm -rf "${LOCATION}/${NAME}"
      echo "$(date +'%Y-%m-%d %H:%M:%S') [Moved] (#${TORRENT_ID}) ${NAME}"
    fi
  done
done

