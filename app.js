const path = require( "path" );
const request = require( "request" );
const express = require( "express" );

const app = express();
const http = require( "http" ).Server( app );
const io = require( "socket.io" )( http );

var bodyParser = require( "body-parser" );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );

const gapi = require( "./google-api.json" );
const langMap = require( "./languages.json" );

const TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";


app.use( express.static( "./public" ) );

// Send the language map JSON file is the client requests it
app.get( "/js/languages.json", function ( a_req, a_res, a_body )
{
	a_res.sendFile( path.join( __dirname, "languages.json" ) );
} );


//app.post( "/party", function ( a_req, a_res )
io.on( "connection", function ( a_sock )
{
	console.log( "User connected" );
	a_sock.on( "disconnect", function ()
	{
		console.log( "user disconnected" );

	} );

	a_sock.on( "translate", function ( a_params )
	{
		console.log( a_params )
		// Validate input
		if ( a_params.text == undefined || a_params.languages == undefined )
		{
			a_sock.emit( "err", "Missing input parameters" );
			return;
		}

		var languages = a_params.languages.replace( /\s/g, "" ).split( "," );
		if ( languages.length == 0 )
		{
			a_sock.emit( "err", "invalid languages input" );
			return;
		}

		// Validate input languages
		var humanLangs = [];
		for ( var i = 0; i < languages.length; ++i )
		{
			if ( langMap[ languages[ i ] ] == undefined )
			{
				a_sock.emit( "err", "Invalid language: " + languages[ i ] );
				return;
			}

			humanLangs.push( langMap[ languages[ i ] ] );
		}

		console.log( "Translating through: " + humanLangs.join( " -> " ) );
		translate( languages, 0, a_params.text, [], a_sock );
	} );
} );

http.listen( 3000, function ()
{
	console.log( "Listening on port 3000" );
} );


function translate( a_languages, a_langIndex, a_textToTranslate, a_translations, a_sock )
{
	// If we've seen this translation already, send the response.
	// This prevents an infinite loop of conversions
	if ( a_translations.includes( a_textToTranslate ) )
	{
		a_sock.emit( "translation", {
			language: a_languages[ a_languages.length - 1 ],
			translation: a_textToTranslate,
			equilibrium: true
		} );
		console.log( "Equilibrium: " + a_textToTranslate );
		console.log( "~ done ~" );
		return;
	}

	console.log( "Translating: " + a_textToTranslate );

	request.post( {
		url: TRANSLATE_URL,
		form: {
			q: a_textToTranslate,
			target: a_languages[ a_langIndex % a_languages.length ],
			format: "text",
			source: a_languages[ a_langIndex - 1 % a_languages.length ],
			model: "base",
			key: gapi.api_key
		}
	}, function ( a_err, a_response, a_body )
		{
			if ( a_err )
			{
				a_sock.emit( "error", "Something gone and done goofed :/" )( a_err );
				return;
			}

			// TODO: check if there is an error code in google's response object

			const body = JSON.parse( a_body );

			if ( body == undefined || body.data == undefined || body.data.translations == undefined )
			{
				a_sock.emit( "error", "Unexpected response from Google Translate API" );
				return;
			}

			a_sock.emit( "translation", { language: langMap[ a_languages[ a_langIndex % a_languages.length ] ], translation: body.data.translations[ 0 ].translatedText } );

			// If the result is in the target language (probably English 99% of the time),
			// add the result to the array of translations
			if ( a_langIndex % a_languages.length == 0 )
				a_translations.push( a_textToTranslate );

			translate( a_languages, a_langIndex + 1, body.data.translations[ 0 ].translatedText, a_translations, a_sock );
		}
	);
}

function GetHumanLanguage( a_languageCode )
{
	return langMap[ langMap.indexOf[ a_languageCode ] ];
}