// To see all functionality, try lot = [42, 43, 47]

$('#bblForm').submit((event) => {

  event.preventDefault();

  $('#violationsMessage, #violationsCount').text('');

  var boro = $('#boro').val();
  var block = $('#block').val();
  var lot = $('#lot').val();

  Promise.all([
      getHpdJurisdiction(boro, block, lot),
      getViolationCount(boro, block, lot)
    ])
    .then((allData) => {
      // All data available here in the order it was called.

      var isReg = allData[0];
      var violCounts = allData[1];

      console.log(isReg);
      console.log(violCounts);

      if (violCounts['Total'] == 0 && !isReg) {

        $('#violMessage')
          .text('This property is not subject to HPD\'s jurisdiction');
        $('.violClass, .violCount').text('');

        return;
      }

      $('#violMessage')
        .text('Number of Open Housing Code Violations:');

      ['A', 'B', 'C'].forEach((i) => {
        $('#violClass' + i).text('Class ' + i + ':');
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

    data.forEach(function(row) {
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
  var promiseObj = new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: "GET",
      data: {"query": query}
    }).done((data) => {
      console.log(data);
      resolve(data);
    }).fail(() => {
      console.log('request failed');
      reject('request failed');
    });
  });
  return promiseObj;
}
