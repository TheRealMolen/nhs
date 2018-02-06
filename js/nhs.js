
(function(){
    'use strict';


    var toRadians = function(deg) { return deg * Math.PI / 180; };

    // calculate the distance between two points based on latitude & longitude
    // code from: https://www.movable-type.co.uk/scripts/latlong.html
    var latLongDist = function(lat1,lon1,lat2,lon2) {
        var R = 6371e3; // metres
        var φ1 = toRadians( lat1 );
        var φ2 = toRadians( lat2 );
        var Δφ = toRadians( lat2-lat1 );
        var Δλ = toRadians( lon2-lon1 );

        var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    };

    var getClosestHospital = function(lat,long, hlist) {
        if(typeof(hlist) === 'undefined')
            hlist = hospitals;

        lat = +lat;
        long = +long;

        // find my nearest hospital
        var closestDist = 100000;
        var closest = null;
        hospitals.forEach(function(hospital) {
            var dist = latLongDist(lat,long, +hospital.Latitude,+hospital.Longitude);
            if( dist < closestDist ) {
                closest = hospital;
                closestDist = dist;
            }
        });

        return closest;
    };


    // lazy load data
    var hospitals = false;
    var charities = false;
    var hospitalsCleaned = false;
    var hprom = d3.csv( 'data/NHSHospitals.csv', function(data) { 
        hospitals = data; });
    var cprom = d3.csv( 'data/NHSCharities.csv', function(data) { 
        charities = data; });

    var ensureHospitalsCleaned = function() {
        if( hospitalsCleaned ) return;

        // make a map from trust name -> charity info
        var trustCharities = {};
        charities.forEach(function(charity) {
            trustCharities[charity.Trust] = { CharitySite:charity['Charity Site'], DirectDonation:charity['Direct Donation'] };
        });

        // inflate all hospitals with charity info
        hospitals.forEach(function(hospital) {
            if( typeof(trustCharities[hospital.ParentName]) === 'undefined' ) {
                hospital.NhsTrust = false;
                return;
            }

            var charity = trustCharities[hospital.ParentName];
            hospital.NhsTrust = true;
            hospital.CharitySite = charity.CharitySite;
            hospital.DirectDonation = charity.DirectDonation;
        });

        // filter out any non-NHS Trust hospitals
        hospitals = hospitals.filter( function(hospital) { return hospital.NhsTrust; } );

        hospitalsCleaned = true;
    };

    var findNhsTrusts = function() {
        var postcode = new Postcode( $("#your-postcode").val() );
        if( !postcode.valid() ) {
            return;
        }

        var nicecode = postcode.normalise().replace(' ','');
        $.getJSON( "https://api.postcodes.io/postcodes/" + nicecode + "?callback=?", 
                   function(info) {handlePostcodeInfo(info);} );

        var handlePostcodeInfo = function(info) {
            Promise.all([hprom,cprom]).then(function(){
                ensureHospitalsCleaned();

                var hospital = getClosestHospital(+info.result.latitude, +info.result.longitude);

                var templateinfo = {
                    hospitalname: hospital.OrganisationName,
                    trustname: hospital.ParentName,
                    trustsite: hospital.Website,
                    charitysite: hospital.CharitySite,
                    donationsite: hospital.DirectDonation
                };

                var html = '';
                html += Mustache.to_html($('#templ-trustname').html(), templateinfo);
                html += Mustache.to_html($('#templ-' + (templateinfo.charitysite?'':'no') + 'charity').html(), templateinfo);
                html += Mustache.to_html($('#templ-' + (templateinfo.donationsite?'':'no') + 'donation').html(), templateinfo);

                $('#trust-info').html(html);
            });
        };
    };

    $("#find-trusts").on('click', findNhsTrusts);
}());