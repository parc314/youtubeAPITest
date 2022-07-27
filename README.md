# youtubeAPITest

Description - A cron job which calls searchVideos function every 10 sec to fetch video info using youtube api and insert into our tables. We can then access this information using get endpoints. 

Fetaures - You can provide multiple space separated api keys to the API_KEY environment variable present in .env file. This will ensure if one key quota is exhausted it will shift to new key.

Endpoints -
1. Get all videos - http://localhost:5000/get/videos?pageNumber=2&pageSize=20. If pageSize and pageNumber are not provided it will take the default values.
2. Get a video using title and description - http://localhost:5000/get/video?title=''&description=''. Make sure the url is encoded.


You will need docker compose to run the service

How to run -
1. git clone https://github.com/parc314/youtubeAPITest.git
2. docker-compose down --rm all
3. docker-compose up  
4. Verify by using the get endpoint
