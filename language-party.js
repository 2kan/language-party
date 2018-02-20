const path = require( "path" );
const request = require( "request" );
const express = require( "express" );

const app = express();
const http = require( "http" ).Server( app );
const io = require( "socket.io" )( http );

var bodyParser = require( "body-parser" );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );

const logger = require( "./Logger.js" );

const gapi = require( "./google-api.json" );
const langMap = require( "./languages.json" );

const TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";
const TRANSLATE_DELAY = 500; // 0.5 second delay between each request to gAPI
const MAX_PHRASE_LENGTH = 500; // max number of characters to convert
const PORT = 80; // TODO: set this via config / env variables

var clientData = [];


app.use( express.static( "./public" ) );

// Send the language map JSON file is the client requests it
app.get( "/js/languages.json", function ( a_req, a_res, a_body )
{
	a_res.sendFile( path.join( __dirname, "languages.json" ) );
} );


//app.post( "/party", function ( a_req, a_res )
io.on( "connection", function ( a_sock )
{
	logger.info( "User connected - ID " + a_sock.id );
	clientData[ a_sock.id ] = { translationInProgress: false };

	a_sock.on( "disconnect", function ()
	{
		logger.info( "User disconnected - ID " + a_sock.id );
		delete clientData[ a_sock.id ];
	} );

	a_sock.on( "translate", function ( a_params )
	{
		logger.verbose( "[" + a_sock.id + "] Incoming translation.." );
		// Check if the client is already translating something
		if ( clientData[ a_sock.id ].translationInProgress )
		{
			// No need to respond with an error (famous last words)
			return;
		}

		//console.log( a_params, a_sock.id );
		// Validate input
		if ( a_params.text == undefined || a_params.languages == undefined )
		{
			a_sock.emit( "err", "Missing input parameters" );
			return;
		}

		var languages = a_params.languages.replace( /\s/g, "" ).split( "," );
		if ( languages.length == 0 )
		{
			a_sock.emit( "err", "Invalid language input" );
			return;
		}

		// Trim extra characters from translation if someone tries to submit
		// a message that's too long (and got past the client-side restriction)
		if ( a_params.text.length > MAX_PHRASE_LENGTH )
			a_params.text = a_params.text.slice( 0, MAX_PHRASE_LENGTH );

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

		logger.verbose( "[" + a_sock.id + "] Translating through: " + humanLangs.join( " -> " ) );
		clientData[ a_sock.id ].translationInProgress = true;

		translate( languages, 0, a_params.text, [], a_sock );
	} );
} );

http.listen( PORT, function ()
{
	logger.info( "Listening on port " + PORT );
} );


function translate( a_languages, a_langIndex, a_textToTranslate, a_translations, a_sock )
{
	// Stop translating if the client has disconnected
	if ( !clientData[ a_sock.id ] )
		return;

	// If we've seen this translation already, send the response.
	// This prevents an infinite loop of conversions
	if ( a_translations.includes( a_textToTranslate ) )
	{
		a_sock.emit( "translation", {
			language: langMap[ a_languages[ a_languages.length - 1 ] ],
			translation: a_textToTranslate,
			equilibrium: true
		} );
		logger.verbose( "[" + a_sock.id + "] Equilibrium: " + a_textToTranslate );
		logger.verbose( "[" + a_sock.id + "] ~ done ~" );

		clientData[ a_sock.id ].translationInProgress = false;

		return;
	}

	logger.verbose( "[" + a_sock.id + "] Translating: " + a_textToTranslate );
	// TODO: use better logging lol

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
				a_sock.emit( "err", "Something gone and done goofed :/" )( a_err );
				logger.warn( "Error when calling gAPI:" );
				logger.warn( a_err );
				return;
			}

			// TODO: check if there is an error code in google's response object

			const body = JSON.parse( a_body );

			if ( body == undefined || body.data == undefined || body.data.translations == undefined )
			{
				a_sock.emit( "err", "Unexpected response from Google Translate API" );
				logger.warn( "Unexpected response from gAPI:" );
				logger.warn( a_body );
				return;
			}

			a_sock.emit( "translation", { language: langMap[ a_languages[ a_langIndex % a_languages.length ] ], translation: body.data.translations[ 0 ].translatedText } );

			// If the result is in the target language (probably English 99% of the time),
			// add the result to the array of translations
			if ( a_langIndex % a_languages.length == 0 )
				a_translations.push( a_textToTranslate );

			// Wait for a little bit then translate again
			setTimeout( translate, TRANSLATE_DELAY, a_languages, a_langIndex + 1, body.data.translations[ 0 ].translatedText, a_translations, a_sock );
		}
	);
}

function GetHumanLanguage( a_languageCode )
{
	return langMap[ langMap.indexOf[ a_languageCode ] ];
}