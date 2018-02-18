const express = require( "express" );
const app = express();
const request = require( "request" );

var bodyParser = require( "body-parser" );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );

const gapi = require( "./google-api.json" );
const langMap = require( "./languages.json" );

const TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

//const languages = [ "zu", "en" ];

app.post( "/", function ( a_req, a_res )
{
	console.log( "." );
	if ( a_req.body[ "text" ] == undefined || a_req.body[ "languages" ] == undefined )
	{
		a_res.status( 400 ).send( "missing input" ); // todo: make this mor informative
		return;
	}

	var languages = a_req.body[ "languages" ].replace( /\s/g, "" ).split( "," );
	if ( languages.length == 0 )
	{
		a_res.status( 400 ).send( "invalid languages input" );
		return;
	}

	// Validate input languages
	var humanLangs = [];
	for ( var i = 0; i < languages.length; ++i )
	{
		if ( langMap[ languages[ i ] ] == undefined )
		{
			a_res.status( 400 ).send( "invalid language: " + languages[ i ] );
			return;
		}

		humanLangs.push( langMap[ languages[ i ] ] );
	}

	console.log( "Translating through: " + humanLangs.join( " -> " ) );
	translate( languages, 0, a_req.body[ "text" ], [], a_res );
} );

function translate( a_languages, a_langIndex, a_textToTranslate, a_translations, a_httpResponse )
{
	if ( a_translations.includes( a_textToTranslate ) )
	{
		//console.log( a_translations );
		a_httpResponse.send( a_textToTranslate );
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
				a_httpResponse.status( 500 ).send( "Something gone and done goofed :/" )( a_err );
				return;
			}

			// TODO: check if there is an error code in google's response object

			const body = JSON.parse( a_body );

			if ( body == undefined || body.data == undefined || body.data.translations == undefined )
			{
				a_httpResponse.status( 500 ).send( "Unexpected response from Google Translate API" );
				return;
			}

			//console.log( body.data.translations[ 0 ].translatedText );

			if ( a_langIndex % a_languages.length == 0 )
			{
				a_translations.push( a_textToTranslate );
				//console.log( "added " + a_textToTranslate + " to translated array." );
			}

			translate( a_languages, a_langIndex + 1, body.data.translations[ 0 ].translatedText, a_translations, a_httpResponse );
		}
	);
}

app.listen( 3000, function ()
{
	console.log( "Listning on 3000" );
} );

