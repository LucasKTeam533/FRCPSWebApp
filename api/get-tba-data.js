export default async function handler(request, response) {
    // Get event key from frontend
    const { eventKey } = request.query;

    if (!eventKey) {
        return response.status(400).json({ error: "Missing eventKey parameter" });
    }

    // Taking api key straight from Vercel environment variables
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
        // Run through Vercel to remain anonymous :)))) 
        const [matchesResponse, teamsResponse, oprsResponse] = await Promise.all([
            fetch(`${baseUrl}/event/${eventKey}/matches`, fetchOptions),
            fetch(`${baseUrl}/event/${eventKey}/teams`, fetchOptions), 
            fetch(`${baseUrl}/event/${eventKey}/oprs`, fetchOptions)
        ]);

        if (!matchesResponse.ok) {
            const errorText = await matchesResponse.text();
            return response.status(matchesResponse.status).json({
                error: `TBA API returned status ${matchesResponse.status}`,
                details: errorText
            });
        }

        const data = await matchesResponse.json();
        const teamData = await teamsResponse.json(); // Parsing from JSON file
        const oprData = await oprsResponse.json();

        // Return so when response is called in JS file, it goes as 3 arrays
        return response.status(200).json({ data, teamData, oprData });
    } catch (error) {
        return response.status(500).json({ error: "Failed to fetch data from TBA", details: error.message });
    }
}
