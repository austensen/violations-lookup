// To see all functionality, try lot = [42, 43, 47]

$('#bblForm').submit(function(event) {

  event.preventDefault();

  $('#violationsMessage, #violationsCount').text('');

  var boro = document.getElementById("boro").value;
  var block = document.getElementById("block").value;
  var lot = document.getElementById("lot").value;

  Promise.all([
      getHpdJurisdiction(boro, block, lot),
      getViolationCount(boro, block, lot)
    ])
    .then(function(allData) {
      // All data available here in the order it was called.

      var isReg = allData[0];
      var violCounts = allData[1];
      
      console.log(isReg);
      console.log(violCounts);
      
      if (violCounts["Total"] == 0 && !isReg) {

        $('#violMessage')
          .text('This property is not subject to HPD\'s jurisdiction');
        $('.violClass, .violCount').text('');
  
        return;
      }

      $('#violMessage')
        .text('Number of Open Housing Code Violations:');
       
      ["A", "B", "C"].map(function(i) {
        $('#violClass' + i).text("Class " + i + ":");
        $('#violCount' + i).text(violCounts[i]);
        console.log(violCounts[i]);
      });
      
    });
});

function getViolationCount(boro, block, lot) {

  var url = "https://data.cityofnewyork.us/resource/b2iz-pps8.json";

  var query = "SELECT class" +
    " WHERE violationstatus='Open'" +
    " AND boroid=" + boro +
    " AND block=" + block +
    " AND lot=" + lot +
    " |> SELECT class, COUNT(*) AS violCount" +
    " GROUP BY class";

  function processResp(data) {
 
    var violCounts = {"A": 0, "B": 0, "C": 0, "Total": 0};
    var count = 0;
    
    data.map(function(row) {
      count = parseInt(row.violCount);
      violCounts[row.class] = count;
      violCounts["Total"] += count; 
    });
    
    return violCounts;
  }

  return getOpenData(url, query).then(processResp);
}


function getHpdJurisdiction(boro, block, lot) {

  var url = "https://data.cityofnewyork.us/resource/sc6a-36xc.json";

  var query = "SELECT COUNT(*) AS regCount" +
    " WHERE boroid=" + boro +
    " AND block=" + block +
    " AND lot=" + lot;

  function processResp(data) {
    if (data[0].regCount == '0') {
      return false;
    } else {
      return true
    }
  }

  return getOpenData(url, query).then(processResp);
}

function getOpenData(url, query) {
  var promiseObj = new Promise(function(resolve, reject) {
    $.ajax({
      url: url,
      type: "GET",
      data: {
        "$query": query,
        "$$app_token": apiKey
      }
    }).done(function(data) {
      console.log(data);
      resolve(data);
    }).fail(function() {
      console.log('request failed');
      reject('request failed');
    });
  });
  return promiseObj;
}

var apiKey = "q1X82JLIrsTVpLn97wdSxf36c";

// Had an idea to make it so that I don't have to hardcode in my own key, but it just seemed too annoying to make others input their own key and it didn't think it really mattered.

// API entry method taken from : https://jsfiddle.net/user2314737/7cfpxpf7/
// var apiKey = prompt("Please enter your NYC Open Data API key ", "");

// Tried to add an option for inputting address (like GOAT) to get BBL via geoclient API (attempt: https://jsfiddle.net/austensen/amLdfz8s/)
// But the geoclient api does not accept cross-origin requests, and it didn't seem worth it for now to mess around with proxy requests.
