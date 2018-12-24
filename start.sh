cd ~/wiki
git pull
npm install
osascript -e "tell application \"Terminal\" to do script \"cd ~/wiki && npm start\""
sleep 1;
open -a "Google Chrome" http://localhost:3000
