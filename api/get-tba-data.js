export default async function handler(request, response) {
  //get event key from frontend
    const { eventKey } = request.query;

    if (!eventKey) {
        return response.status(400).json({ error: "Missing eventKey parameter" });
    }

  //taking api key straight from vercel
    const apiKey = process.env.TBA_API_KEY;
    const baseUrl = "https://www.thebluealliance.com/api/v3";

    const fetchOptions = {
        method: 'GET',
        headers: {
            'X-TBA-Auth-Key': apiKey,
            'accept': 'application/json' 
        }
    };

    try {
        // run through vercel to remain anyonomous 
        const [matchesResponse, teamsResponse, oprsResponse] = await Promise.all([
            fetch(`${baseUrl}/event/${eventKey}/matches`, fetchOptions),
            fetch(`${baseUrl}/event/${eventKey}/teams`, fetchOptions), 
            fetch(`${baseUrl}/event/${eventKey}/oprs`, fetchOptions)
        ]);

        const data = await matchesResponse.json();
        const teamData = await teamsResponse.json(); //parsing from json file
        const oprData = await oprsResponse.json();

        //return so when response is called in js file, it goes as 3 arrays
        return response.status(200).json({ data, teamData, oprData });
    } catch (error) {
        return response.status(500).json({ error: "Failed to fetch data from TBA" });
    }
}
