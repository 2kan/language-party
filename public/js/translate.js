const DEFAULT_LANGUAGE = "en";
const translationTemplate = "<div class='languageCard ~equilibrium~'><div class='content'><h1 class='translation'>~translation~</h1><div class='meta'>Translated to <span class='language'>~language~</span></div></div></div>";
var langMap = [];
var submissionLocked = false;

// Fetch the language map and load the languages into select elements
fetch( "/js/languages.json" )
	.then( response => response.json() )
	.then( json =>
	{
		langMap = json;
		LoadLanguages();
	} );


$( document ).ready( function ()
{
	$( "#inputForm" ).on( "submit", function ()
	{
		Submit();
		return false; // prevent default form submission behaviour
	} );

	$( "#submit" ).on( "click", Submit );
} );

socket.on( "translation", function ( a_response )
{
	console.log( a_response );
	var html = translationTemplate
		.replace( "~translation~", a_response.translation )
		.replace( "~language~", a_response.language )
		.replace( "~equilibrium~", ( a_response.equilibrium ) ? "equilibrium" : "" );

	if ( a_response.equilibrium )
		UnlockSubmission();

	$( "#translationOutlet" ).append( html );
} );

socket.on( "err", function ( a_err )
{
	console.log( a_err );
	$( "#translationOutlet" ).append( "<strong>" + a_err + "</strong>" );
} );



function Submit()
{
	if ( submissionLocked )
		return;

	LockSubmission();

	// Clear last set of translations, if any
	$( "#translationOutlet" ).html( "" );

	var sourceLanguage = $( "#sourceLanguage" ).val();
	var otherLanguage = $( "#otherLanguage" ).val();

	socket.emit( "translate", {
		text: $( "#inputPhrase" ).val(),
		languages: otherLanguage + "," + sourceLanguage
	} );
}

function LoadLanguages()
{
	var languageOptions = "";

	// Create the HTML for the language select elements
	for ( var key in langMap )
	{
		if ( langMap.hasOwnProperty( key ) )
			languageOptions += "<option value='" + key + "'>" + langMap[ key ] + "</option>";
	}

	$( "#sourceLanguage, #otherLanguage" ).append( languageOptions );
	$( "#sourceLanguage" ).val( DEFAULT_LANGUAGE );
	$( "#otherLanguage" ).val( GetRandomLanguage() );
}

function LockSubmission()
{
	submissionLocked = true;
	$( "#submit" ).prop( "disabled", true );
}

function UnlockSubmission()
{
	submissionLocked = false;
	$( "#submit" ).prop( "disabled", false );
}

function GetRandomLanguage()
{
	var langCodes = Object.keys( langMap );
	var randomIndex = Math.floor( Math.random() * langCodes.length );

	return langCodes[ randomIndex ];
}