document.getElementById('predictButton').addEventListener('click', async function() {
    console.log("PROGRAM STARTED!");
    
    const eventKey = document.getElementById('eventKeyInput').value;
    const offlineBanner = document.getElementById('offline-banner');
    var totalTrue = 0;
    var checkedMatches = 0;

    if ('serviceWorker' in navigator) 
    {
        window.addEventListener('load', () => 
        {
            navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
        }
        );
    }
    try {
        // thisis  in the api folder, for fetching the data through vercel for api security
        const response = await fetch(`/api/get-tba-data?eventKey=${eventKey}`);
        
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        
        const jsonResult = await response.json();//from vercel
        
        let data = jsonResult.data;
        const teamData = jsonResult.teamData; //putting the data into arrays
        const oprData = jsonResult.oprData;

                const oprs = oprData.oprs || {};
                const dprs = oprData.dprs || {};  
                const ccwms = oprData.ccwms || {};

                data.splice(0, data.length, ...data.filter(m => m.comp_level === 'qm').sort((a, b) => a.match_number - b.match_number));

                console.log(`📥 Successfully retrieved matches. Filtering schedule:\n`);
                console.log("-------------------------------------------------");

                let htmlOutput = "";

                for (let i = 0; i < data.length; i++) {
                    const currentMatch = data[i];

                    const redAlliance = currentMatch.alliances.red;
                    const blueAlliance = currentMatch.alliances.blue;
                    const redTeams = redAlliance.team_keys;
                    const blueTeams = blueAlliance.team_keys;

                    const red1 = parseInt(redTeams[0].substring(3));
                    const red2 = parseInt(redTeams[1].substring(3));
                    const red3 = parseInt(redTeams[2].substring(3));
                    const blue1 = parseInt(blueTeams[0].substring(3));
                    const blue2 = parseInt(blueTeams[1].substring(3));
                    const blue3 = parseInt(blueTeams[2].substring(3));

                    htmlOutput += "Match " + (i + 1) + ":<br>";
                    htmlOutput += "Red Alliance: " + red1 + ", " + red2 + ", " + red3 + "<br>";
                    htmlOutput += "Blue Alliance: " + blue1 + ", " + blue2 + ", " + blue3 + "<br>";

                    var totalRedOPR = 0;
                    var totalBlueOPR = 0;
                    var totalRedDPR = 0;
                    var totalBlueDPR = 0;
                    var highestBlueCCWMName = "frcNull";
                    var highestRedCCWMName = "frcNull";
                    var highestBlueCCWM = -Infinity;
                    var highestRedCCWM = -Infinity;
                    var totalRedCCWM = 0;
                    var totalBlueCCWM = 0;

                    var winningAlliance = currentMatch.winning_alliance
                    if(winningAlliance != "")
                    {
                        checkedMatches++;
                    }


                    for (let j = 0; j < teamData.length; j++) {
                        var currentTeam = teamData[j];

                        if (currentTeam.key === ("frc" + red1) || currentTeam.key === ("frc" + red2) || currentTeam.key === ("frc" + red3)) {
                            totalRedOPR += (oprs[currentTeam.key]);
                            totalRedDPR += (dprs[currentTeam.key]);
                            totalRedCCWM += (ccwms[currentTeam.key]);
                            if(ccwms[currentTeam.key] > highestRedCCWM) {
                                highestRedCCWMName = currentTeam.key;
                                highestRedCCWM = (ccwms[currentTeam.key]);
                            }
                        }
                        if (currentTeam.key === ("frc" + blue1) || currentTeam.key === ("frc" + blue2) || currentTeam.key === ("frc" + blue3)) {
                            totalBlueOPR += (oprs[currentTeam.key]);
                            totalBlueDPR += (dprs[currentTeam.key]);
                            totalBlueCCWM += (ccwms[currentTeam.key]);
                            if(ccwms[currentTeam.key] > highestBlueCCWM) {
                               highestBlueCCWMName = currentTeam.key;
                                highestBlueCCWM = (ccwms[currentTeam.key]);
                            }
                        }
                    }

                    var totalRedAmount = totalRedOPR + totalBlueDPR;
                    var totalBlueAmount = totalBlueOPR + totalRedDPR;
                    var predictedWin = "";
                    if(totalRedAmount > totalBlueAmount)
                    {
                        predictedWin = "red"
                    }
                    else
                    {
                        predictedWin = "blue"
                    }
                    var isCorrect = false
                    if(predictedWin === winningAlliance)
                    {
                        isCorrect = true;
                    }
                    if(Math.abs(totalRedAmount - totalBlueAmount) < 25) {
                        if(totalRedCCWM > totalBlueCCWM) {
                            htmlOutput += "Red Alliance is predicted to have a  " + calcPercent(totalRedAmount, totalBlueAmount, "red") + "% chance of winning<br>"
                            htmlOutput +=  "Team " + highestRedCCWMName.replace("frc", "") + " has highest Red carry potential.<br>"
                            htmlOutput += "Team " + highestBlueCCWMName.replace("frc", "") + " has highest Blue carry potential.<br>"
                        } else {
                            htmlOutput += "Blue Alliance is predicted to have a  " + calcPercent(totalRedAmount, totalBlueAmount, "blue") + "% chance of winning<br>"
                            htmlOutput += "Team " + highestRedCCWMName.replace("frc", "") + " has highest Red carry potential.<br>"
                            htmlOutput += "Team " + highestBlueCCWMName.replace("frc", "") + " has highest Blue carry potential.<br>"
                        }
                    } else if(totalBlueAmount > totalRedAmount) {
                        htmlOutput += "Blue Alliance is predicted to have a  " + calcPercent(totalRedAmount, totalBlueAmount, "blue") + "% chance of winning<br>"
                        htmlOutput += "Team " + highestRedCCWMName.replace("frc", "") + " has highest Red carry potential.<br>"
                        htmlOutput += "Team " + highestBlueCCWMName.replace("frc", "") + " has highest Blue carry potential.<br>"
                    } else {
                        htmlOutput +=  "Red Alliance is predicted to have a  " + calcPercent(totalRedAmount, totalBlueAmount, "red") + "% chance of winning<br>"
                        htmlOutput += "Team " + highestRedCCWMName.replace("frc", "") + " has highest Red carry potential.<br>"
                        htmlOutput += "Team " + highestBlueCCWMName.replace("frc", "") + " has highest Blue carry potential.<br>"
                    }
                    //htmlOutput += isCorrect + "</br>"
                    htmlOutput += "--------------------------------<br>";
                    if(isCorrect)
                    {
                        totalTrue ++
                    }
                }
                var percentCorrect = 100*totalTrue/checkedMatches;
                percentCorrect = Math.round(percentCorrect * 100.0)/100.0;
                htmlOutput += percentCorrect + "% accuracy!";
                document.getElementById('outputDisplay').innerHTML = htmlOutput; 

  }       catch (error) {
        console.error("An error occurred while fetching or processing data:", error);
        document.getElementById('outputDisplay').innerHTML = "Error: " + error.message;
    }    });


function calcPercent(redAmt, blueAmt, allianceColor) {
    var scoreDifference;
    if(allianceColor === ("red")) {
        scoreDifference = redAmt - blueAmt;
    } else {
        scoreDifference = blueAmt - redAmt;
    }
    var calculatedPct = 1.0/(1.0+(Math.pow(10.0, (-scoreDifference/200.0))));
    calculatedPct = Math.round(calculatedPct * 10000.0)/100.0;
    return calculatedPct;
}

function updateOnlineStatus() {
  if (navigator.onLine) {
    offlineBanner.classList.add('hidden');
    console.log("Back online!");
  } else {
    offlineBanner.classList.remove('hidden');
    console.warn("Connection lost. App is offline.");
  }
}
window.addEventListener('load', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
window.addEventListener('online', updateOnlineStatus);
