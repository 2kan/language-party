const DEFAULT_LANGUAGE = "en";
const translationTemplate = "<div class='languageCard ~equilibrium~'><div class='content'><h1 class='translation'>~translation~</h1><div class='meta'>Translated to <span class='language'>~language~</span></div></div></div>";
var langMap = [];

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

	$( "#translationOutlet" ).append( html );
} );

socket.on( "err", function ( a_err )
{
	console.log( a_err );
	$( "#translationOutlet" ).append( "<strong>" + a_err + "</strong>" );
} );



function Submit()
{
	// Clear last set of translations, if any
	$( "#translationOutlet" ).html( "" );

	socket.emit( "translate", {
		text: $( "#inputPhrase" ).val(),
		languages: "th,en"
	} );
}

function LoadLanguages()
{
	var languageOptions = "";
	for ( var key in langMap )
	{
		if ( langMap.hasOwnProperty( key ) )
			languageOptions += "<option value='" + key + "'>" + langMap[ key ] + "</option>";
	}

	$( "#sourceLanguage, #otherLanguage" ).append( languageOptions );
	$( "#sourceLanguage" ).val( DEFAULT_LANGUAGE );
	$("#otherLanguage")
}