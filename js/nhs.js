
(function(){
    'use strict';


    var recalcTax = function() {
        var income = $("#gross-income").val();
        if( Number.isNaN(income) ) {
            $("#tax-result").hide();
            return;
        }

        income = +income;
        if( $("#periodmonth").is(':checked') ) {
            income *= 12;
        }

        var baserate=1,hirate=1,addrate=1;
        if( $("#rate1prog").is(':checked') ) {
            hirate=1.5;
            addrate=2;
        }
        
        // Tax Bands: https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past#tax-rates-and-bands
        var addband = 150000;
        var hiband = 33500;
        var allowance = 11500;
        if( income > 100000 ) {
            allowance -= (income - 100000) / 2;
            if( allowance < 0 )
                allowance = 0;
        }

        var tax = 0;
        var taxable = income - allowance;
        if( taxable > 0 ) {
            if( taxable > addband ) {
                tax += addrate * (taxable - addband);
                taxable = addband;
            }
            if( taxable > 33500 ) {
                tax += hirate * (taxable - 33500);
                taxable = 33500;
            }
            tax += baserate * taxable;

            tax /= 100;
        }

        var monthlytax = Math.floor(tax / 12);

        $("#taxcalc").text( monthlytax );
        $("#tax-result").show();
    };



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

    var searching = false;
    var findNhsTrusts = function() {
        if( searching ) {
            console.log( "still searching from before...");
        }

        var postcode = new Postcode( $("#your-postcode").val() );
        if( !postcode.valid() ) {
            var templateinfo = {error:'There was a problem looking up that postcode. Please be sure to only use full UK postcodes, like SW1A 2AA'};
            var html = Mustache.to_html($('#templ-error').html(), templateinfo);
            $('#trust-info').html(html);
            return;
        }

        searching = true;
        $('#trust-info').html('');

        var nicecode = postcode.normalise().replace(' ','');
        $.getJSON( "https://api.postcodes.io/postcodes/" + nicecode + "?callback=?", 
                   function(info) {handlePostcodeInfo(info);} )
            .fail(function() {
                var templateinfo = {error:'There was a problem looking up that postcode. Please check your internet connection and be sure to only use full UK postcodes, like SW1A 2AA'};
                var html = Mustache.to_html($('#templ-error').html(), templateinfo);
                $('#trust-info').html(html);
                searching = false;
            });

        var handlePostcodeInfo = function(info) {
            if( info.status != 200 ) {
                var templateinfo = {error:'There was a problem looking up that postcode. Please be sure to only use full UK postcodes, like SW1A 2AA'};
                var html = Mustache.to_html($('#templ-error').html(), templateinfo);
                $('#trust-info').html(html);
                searching = false;
                return;
            }

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
                if( templateinfo.donationsite ) {
                    html += Mustache.to_html($('#templ-donate').html(), templateinfo);
                }
                html += Mustache.to_html($('#templ-trustname' + (templateinfo.trustsite?'':'nosite')).html(), templateinfo);
                html += Mustache.to_html($('#templ-' + (templateinfo.charitysite?'':'no') + 'charity').html(), templateinfo);
                html += Mustache.to_html($('#templ-' + (templateinfo.donationsite?'':'no') + 'donation').html(), templateinfo);

                $('#trust-info').html(html);
                
                searching = false;
            });
        };
    };

    $("#gross-income").on('keyup', recalcTax);
    $("#periodmonth").on('change', recalcTax);
    $("#periodyear").on('change', recalcTax);
    $("#rate1flat").on('change', recalcTax);
    $("#rate1prog").on('change', recalcTax);
    $("#your-postcode").on('keyup', function(event) {
        if( event.keyCode === 13 )
            findNhsTrusts();
    });
    $("#find-trusts").on('click', findNhsTrusts);
    $("#find-trusts").on('change', findNhsTrusts);
}());