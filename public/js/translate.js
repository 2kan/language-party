const DEFAULT_LANGUAGE = "en";
const translationTemplate = "<div class='languageCard ~equilibrium~'><div class='content'><h1 class='translation'>~translation~</h1><div class='meta'>Translated to <span class='language'>~language~</span></div></div></div>";
const equilibriumTemplate = "<div class='languageCard equilibriumFound'><div class='content'><h1 class='translation'>Equilibrium found!</h1></div></div></div>";

var langMap = [];
var submissionLocked = false;
var footerHeight = 0;
var useExtraLanguage = true;

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
	// Get the height of the footer, adding 50(px) for smooth scrolling
	footerHeight = $( ".footer" )[ 0 ].getBoundingClientRect().height + 50;

	$( "#inputForm" ).on( "submit", function ()
	{
		Submit();
		return false; // prevent default form submission behaviour
	} );

	$( "#submit" ).on( "click", Submit );

	$( "#addLanguage" ).on( "click", function ()
	{
		$( this ).css( "display", "none" );
		$( "#extraLanguageControl" ).css( "display", "inline-block" );
		useExtraLanguage = true;
	} );
} );

socket.on( "translation", function ( a_response )
{
	console.log( a_response );
	var html = translationTemplate
		.replace( "~translation~", a_response.translation )
		.replace( "~language~", a_response.language )
		.replace( "~equilibrium~", ( a_response.equilibrium ) ? "equilibrium" : "" );

	var newCard = $( "#translationOutlet" ).append( html );

	// Scroll down to the new message
	var rect = $( newCard )[ 0 ].getBoundingClientRect();

	if ( a_response.equilibrium )
	{
		var equilibriumCard = $( "#translationOutlet" ).append( equilibriumTemplate );
		rect = $( equilibriumCard )[ 0 ].getBoundingClientRect();
		UnlockSubmission();
	}

	window.scroll( { top: rect.y + rect.height + footerHeight, left: 0, behavior: "smooth" } );
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
	var extraLanguage = $( "#extraLanguage" ).val();

	var languages = otherLanguage + "," + sourceLanguage;
	if ( useExtraLanguage )
		languages = otherLanguage + "," + extraLanguage + "," + sourceLanguage

	socket.emit( "translate", {
		text: $( "#inputPhrase" ).val(),
		languages: languages
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

	$( "#sourceLanguage, #otherLanguage, #extraLanguage" ).append( languageOptions );
	$( "#sourceLanguage" ).val( DEFAULT_LANGUAGE );
	$( "#otherLanguage" ).val( GetRandomLanguage() );
	$( "#extraLanguage" ).val( GetRandomLanguage() );
}

function LockSubmission()
{
	submissionLocked = true;
	$( "#submit" ).addClass( "is-loading" );
}

function UnlockSubmission()
{
	submissionLocked = false;
	$( "#submit" ).removeClass( "is-loading" );
}

function GetRandomLanguage()
{
	var langCodes = Object.keys( langMap );
	var randomIndex = Math.floor( Math.random() * langCodes.length );

	return langCodes[ randomIndex ];
}