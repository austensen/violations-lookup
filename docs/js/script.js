// To see all functionality, try lot = [42, 43, 47]

const map = L.map('map').setView([40.7059989, -73.962548], 11);

L.tileLayer('https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


$('#addressForm').submit((event) => {

  event.preventDefault();

  // map.clearLayers();

  const address = $('#address').val();

  getBBL(address).then((property) => {

    const bbl = splitBBL(property.bbl);

    Promise.all([
      getHpdJurisdiction(bbl),
      getViolationInfo(bbl)
    ])
    .then((allData) => {
        // All data available here in the order it was called.
        const isReg = allData[0];
        const violCounts = allData[1].violCounts;
        outputViolInfo(isReg, violCounts);
    });

    map.flyTo(property.latLon, 18)

    // circleOptions defined globally below
    L.circleMarker(property.latLon, circleOptions).addTo(map)
      .bindPopup('BBL: <b>' + property.bbl + '</b>');

  });

});



$('#bblForm').submit((event) => {

  event.preventDefault();

  // map.clearLayers();

  const bbl = $('#bbl').val();

  Promise.all([
    getHpdJurisdiction(splitBBL(bbl)),
    getViolationInfo(splitBBL(bbl))
  ])
  .then((allData) => {
    // All data available here in the order it was called.
    const isReg = allData[0];
    const violCounts = allData[1].violCounts;
    outputViolInfo(isReg, violCounts);

    const latLon = allData[1].latLon;
    map.flyTo(latLon, 18)
    // circleOptions defined globally below
    L.circleMarker(latLon, circleOptions).addTo(map)
      .bindPopup('BBL: <b>' + bbl + '</b>');

  });
});


const outputViolInfo = (isReg, violCounts) => {

  if (violCounts['Total'] == 0 && !isReg) {

    $('#violMessage').text('This property is not subject to HPD\'s jurisdiction');
    $('.violClass, .violCount').text('');

    return;
  }

  $('#violMessage').text('Number of Open Housing Code Violations:');

  ['A', 'B', 'C'].forEach((i) => {
    $('#violClass' + i).text('Class ' + i + ':');
    $('#violCount' + i).text(violCounts[i]);
  });
}


const getViolationInfo = (bbl) => {

  // https://data.cityofnewyork.us/Housing-Development/Housing-Maintenance-Code-Violations/wvxf-dwi5
  const url = 'https://data.cityofnewyork.us/resource/b2iz-pps8.json';

  const query = `SELECT class, latitude AS lat, longitude AS lon` +
    ` WHERE violationstatus='Open'` +
    `    AND boroid = ${bbl.boro} AND block = ${bbl.block} AND lot = ${bbl.lot}` +
    ` |> SELECT class, lat, lon, COUNT(*) AS violCount` +
    `    GROUP BY class, lat, lon`;

  const processResp = (data) => {

    const bblLatLon = [data[0].lat, data[0].lon];

    const violCounts = {'A': 0, 'B': 0, 'C': 0, 'Total': 0};
    let count = 0; //TODO: cut the 0 out

    data.forEach((row) => {
      count = parseInt(row.violCount);
      violCounts[row.class] = count;
      violCounts['Total'] += count;
    });

    const violInfo = {
      'latLon': bblLatLon,
      'violCounts': violCounts
    }

    return violInfo;
  }

  return getOpenData(url, query).then(processResp);
}


const getHpdJurisdiction = (bbl) => {

  // https://data.cityofnewyork.us/Housing-Development/Buildings-Subject-to-HPD-Jurisdiction/kj4p-ruqc
  const url = 'https://data.cityofnewyork.us/resource/sc6a-36xc.json';

  const query = `SELECT COUNT(*) AS regCount` +
    ` WHERE boroid = ${bbl.boro} AND block = ${bbl.block} AND lot = ${bbl.lot}`;

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
    .done((data) => { resolve(data); })
    .fail(() => { reject('request failed'); });
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
      const lonLat = data.features[0].geometry.coordinates

      const property = {
        bbl: data.features[0].properties.pad_bbl,
        latLon: [lonLat[1], lonLat[0]]
      }

      resolve(property);
    })
    .fail(() => { reject('request failed'); });
  });
  return promiseObj;
}


const splitBBL = (bbl) => {
  const bblObj = {
    boro: bbl.substring(0, 1),
    block: bbl.substring(1, 6),
    lot: bbl.substring(6, 10)
  };
  return bblObj;
}

const circleOptions = {
  stroke: false,
  radius: 6,
  fillOpacity: 0.9,
  fillColor: 'gold',
  width: 0
};
