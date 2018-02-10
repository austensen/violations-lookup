// To see all functionality, try lot = [42, 43, 47]

const map = L.map('map').setView([40.7059989, -73.962548], 11);

L.tileLayer('https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


$('#bblForm').submit((event) => {

  event.preventDefault();

  $('#violationsMessage, #violationsCount').text('');

  const boro = $('#boro').val();
  const block = $('#block').val();
  const lot = $('#lot').val();

  Promise.all([
      getHpdJurisdiction(boro, block, lot),
      getViolationCount(boro, block, lot)
    ])
    .then((allData) => {
      // All data available here in the order it was called.

      const isReg = allData[0];
      const violCounts = allData[1];

      console.log(isReg);
      console.log(violCounts);

      if (violCounts['Total'] == 0 && !isReg) {

        $('#violMessage').text('This property is not subject to HPD\'s jurisdiction');
        $('.violClass, .violCount').text('');

        return;
      }

      $('#violMessage').text('Number of Open Housing Code Violations:');

      ['A', 'B', 'C'].forEach((i) => {
        $('#violClass' + i).text('Class ' + i + ':');
        $('#violCount' + i).text(violCounts[i]);
        console.log(violCounts[i]);
      });

    });
});

const getViolationCount = (boro, block, lot) => {

  const url = 'https://data.cityofnewyork.us/resource/b2iz-pps8.json';

  const query = `SELECT class` +
    ` WHERE violationstatus='Open'` +
    `    AND boroid = ${boro} AND block = ${block} AND lot = ${lot}` +
    ` |> SELECT class, COUNT(*) AS violCount` +
    `    GROUP BY class`;

  const processResp = (data) => {

    const violCounts = {'A': 0, 'B': 0, 'C': 0, 'Total': 0};
    let count = 0;

    data.forEach((row) => {
      count = parseInt(row.violCount);
      violCounts[row.class] = count;
      violCounts['Total'] += count;
    });

    return violCounts;
  }

  return getOpenData(url, query).then(processResp);
}


const getHpdJurisdiction = (boro, block, lot) => {

  const url = 'https://data.cityofnewyork.us/resource/sc6a-36xc.json';

  const query = `SELECT COUNT(*) AS regCount` +
    ` WHERE boroid = ${boro} AND block = ${block} AND lot = ${lot}`;

  const processResp = (data) => {
    if (data[0].regCount == '0') {
      return false;
    } else {
      return true
    }
  }

  return getOpenData(url, query).then(processResp);
}

const getOpenData = (url, query) => {
  const promiseObj = new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: 'GET',
      data: {'$query': query}
    })
    .done((data) => {
      console.log(data);
      resolve(data);
    })
    .fail(() => {
      console.log('request failed');
      reject('request failed');
    });
  });
  return promiseObj;
}

const getBBL = (address) => {
  const promiseObj = new Promise((resolve, reject) => {
    $.ajax({
      url: 'https://geosearch.planninglabs.nyc/v1/search?',
      type: 'GET',
      data: {'text': address}
    })
    .done((data) => {
      // console.log(data);
      const lonLat = data.features[0].geometry.coordinates

      const property = {
        bbl: data.features[0].properties.pad_bbl,
        latLon: [lonLat[1], lonLat[0]]
      }

      resolve(property);
    })
    .fail(() => {
      console.log('request failed');
      reject('request failed');
    });
  });
  return promiseObj;
}


$('#addressForm').submit((event) => {

  event.preventDefault();

  const address = $('#address').val();

  getBBL(address).then((property) => {

    const circleOptions = {
      stroke: false,
      radius: 7,
      fillOpacity: 0.8,
      fillColor: 'gold',
      width: 0
    }

    L.circleMarker(property.latLon).addTo(map)
        .bindPopup('<b>' + property.bbl + '</b>');
  });

});
